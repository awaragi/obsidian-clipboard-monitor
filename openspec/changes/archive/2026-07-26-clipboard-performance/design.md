## Context

`ClipboardWatcher.pollOnce()` runs on every poll tick (default 400ms) for the
entire duration of a watch-mode session. For images, the current path is:

```
reader.readImage()
  -> electron clipboard.readImage()   (NativeImage, already decoded)
  -> .toPNG()                          (full PNG re-encode, EVERY tick)
watcher.pollOnce()
  -> hashBuffer(pngBytes)              (SHA-256 over the encoded buffer, EVERY tick)
```

Both the re-encode and the hash run unconditionally, whether or not the
clipboard changed since the last tick. This is the cost proposal.md's
"Performance" phase (item 7) called out: "consider alternatives to hashing
such as size and other metadata so that we do not hash large images."

`hash.ts` currently has no size-awareness — `hashBuffer` SHA-256s whatever
buffer it's handed. `ClipboardReader.readImage()` bundles "read the OS
clipboard" and "encode to PNG" into a single call that returns `Buffer |
null`, so any caller wanting cheaper metadata (like dimensions) currently
has no way to get it without paying for the encode anyway.

## Goals / Non-Goals

**Goals:**
- Remove the unconditional per-tick PNG re-encode from the image dedupe path.
- Remove cryptographic-hash overhead from image dedupe (not needed for this
  use case — nothing here defends against an adversary crafting collisions).
- Preserve exact dedupe correctness: no sampling, no false negatives. A
  genuinely new image must never be silently dropped.
- Add an opt-in way for users to force re-insertion of intentionally
  re-copied identical images, via a clipboard-clear-after-insert setting.

**Non-Goals:**
- Eliminating the per-tick cost entirely. Pure polling cannot detect "did
  anything change" without re-checking *something* every tick; that requires
  an OS-level clipboard change-counter, which is out of scope (see
  Decisions).
- A max clipboard/attachment size cap. Explicitly rejected — see Decisions.
- Any change to text hashing/dedupe. Typical clipboard text hashes in
  microseconds with SHA-256 already; proposal.md never flagged text as a
  concern, and no evidence surfaced of a real bottleneck there.
- Clearing the clipboard for text insertions. The new setting is images-only.

## Decisions

### 1. Stage the dedupe check: dimensions first, bitmap hash second

`NativeImage.getSize()` returns `{width, height}` from the already-decoded
native image with no encoding step — it's metadata Electron already has
after `clipboard.readImage()`, not something `.toPNG()`/`.toBitmap()` needs
to produce. So dimensions are effectively free.

- If the new image's dimensions differ from the last-seen image's
  dimensions, the content is definitely different — skip hashing entirely
  and treat it as new.
- If dimensions match, dimensions alone are insufficient (two different
  images can share a resolution), so fall through to a content hash to
  confirm true equality.

**Alternative considered — dimensions only, no hash fallback:** rejected.
Two different images at the same resolution (a very common case — e.g.
successive screenshots of the same window) would be indistinguishable,
producing false-negative dedupe (a genuinely new image silently dropped).
Unacceptable for a tool whose entire purpose is capturing copied content.

### 2. Hash the raw bitmap, not a freshly-encoded PNG

When a hash is needed, use `NativeImage.toBitmap()` (raw uncompressed
pixels) as the hash input instead of `.toPNG()`. `toBitmap()` skips the
compression pass entirely — it's a copy of already-decoded pixel data, not a
re-encode — at the cost of hashing a larger (uncompressed) buffer.

**Alternative considered — hash `toBitmap().length` as a second cheap
filter:** rejected as ineffective. Raw bitmap byte length is a deterministic
function of `width * height * bytesPerPixel` — it carries no more
discriminating information than `getSize()` already provides for free. It
would not catch same-resolution, different-content images, unlike PNG byte
length (which varies with compressibility of the actual pixel content).

**Alternative considered — check `availableFormats()` for a pre-existing
PNG/format already on the clipboard, read via `readBuffer()`:** genuinely
the cheapest possible path when applicable (zero decode, zero encode — just
already-present bytes), but not guaranteed to be present; source-app
dependent (e.g. macOS commonly populates TIFF, not PNG, for screenshots).
Not relied upon as the primary mechanism since it can't be guaranteed, but
implementation may opportunistically use it when available.

### 3. Non-cryptographic hash algorithm, no new dependency

Image dedupe hashing switches from SHA-256 to a fast non-cryptographic
hash. Cryptographic collision-resistance defends against a deliberate
adversary; nothing here needs that property, only "did the bytes change,"
so a much cheaper algorithm is the correct tool for the job.

Constraint: no new npm dependency (ruling out e.g. `xxhash-wasm`). Two
options remain open for the implementation step:
- A hand-rolled non-cryptographic hash (e.g. FNV-1a) — a handful of lines
  of pure arithmetic, no imports beyond what's already used.
- Node's built-in `crypto.createHash('md5')` (or `sha1`) — already
  imported in `hash.ts` today, meaningfully faster than SHA-256 due to
  smaller digest/simpler rounds, zero new dependency, minimal code churn.

Either preserves full-byte-coverage determinism (unlike sampling). Final
choice deferred to the tasks/implementation step; both are viable and the
difference is a matter of degree, not correctness.

**Alternative considered — random N-pixel sampling of the bitmap, with the
last full bitmap retained in memory for comparison:** rejected. A 1920×1080
image is ~2M pixels; sampling a few hundred/thousand of them is well under
1% coverage. This has a real blind spot for **localized** changes — a
cursor, a highlight, a slide advancing slightly — which is close to this
plugin's flagship use case (background-captured, near-identical sequential
meeting-slide screenshots per proposal.md §4.5's floating-indicator
rationale). Sampling could silently miss exactly the content this plugin
exists to capture. It also requires retaining the full last-seen bitmap in
memory persistently for the whole watch-mode session (tens of MB for a
1080p+ screenshot) versus today's 32-byte hash — a new, unbounded-feeling
memory cost for a background-running plugin. Framing this as a simple "CPU
vs memory" settings dropdown would understate the real trade, which is
speed vs. correctness.

### 4. Defer PNG encoding until content is confirmed new

`.toPNG()` is only called once the bitmap-hash comparison confirms
genuinely new content, immediately before the save-as-attachment step
(`vault.createBinary()` needs PNG bytes). This removes the PNG encode from
the steady-state "nothing changed" tick entirely — it now runs at most once
per genuinely new image, not once per poll tick.

### 5. No max clipboard/attachment size cap

proposal.md §4.6/§4.7 and item 8 ("Polish") floated a global max-size
setting that would skip content above a threshold. Confirmed via codebase
search that nothing for this exists today (it was proposal-only, and even
explicitly deferred in the `images` change's own design doc). Decision:
drop it entirely, not defer it. A silently-skipped image — dropped because
it happened to exceed an arbitrary size threshold — is a worse failure mode
than the performance cost of processing a large image, for a tool whose job
is "never lose what the user copied."

### 6. Clear-clipboard-after-insert setting

New global settings-tab toggle, **off by default**, scoped to **images
only**. When enabled, the plugin calls `clipboard.clear()` immediately
after a successful image save + cursor insertion.

- **Timing**: strictly *after* `vault.createBinary()` and the editor insert
  both succeed — never before. An optimistic pre-clear risks destroying the
  only copy of the content if the save fails partway through.
- **Scope caveat, surfaced in settings copy**: Electron's `clipboard.clear()`
  is all-or-nothing across every clipboard format, not selective. If a
  single copy operation populated both an image and an accompanying
  text/HTML representation, clearing after the image insert also destroys
  that other format — even though content-type scope may never have
  selected it for insertion. Settings copy must state this plainly, along
  with the loss of the ability to paste that image elsewhere afterward.
- **Dedupe interaction**: after clearing, `ClipboardWatcher`'s last-seen
  state naturally has nothing left to compare against on the next tick.
  Confirmed acceptable (and intended): a user who then intentionally
  re-copies the identical image will have it correctly treated as new and
  re-inserted. This is the entire reason the setting exists, not a bug to
  guard against.

**Alternative considered — apply clearing to text insertions too:**
rejected. The motivating use case is screenshot-and-paste; clearing after
every text insertion would be a much larger behavior change with no stated
need, and was explicitly scoped out.

### 7. OS-level clipboard change-counter — set aside

Windows (`GetClipboardSequenceNumber`) and macOS (`NSPasteboard.changeCount`)
both expose a monotonic counter that increments on any clipboard write,
which would let a watcher skip all per-tick work until something actually
changed — the closest thing to a real fix for the structural "must check
something every tick" floor. Electron does not expose this via its public
JS API; using it would require a native addon. Set aside as too large an
architectural shift for this change — this project has stayed pure-JS/no
native deps so far, and introducing one changes the build/distribution
story significantly. Polling remains the model.

## Risks / Trade-offs

- **[Risk]** Even after this change, an unchanged large image sitting on
  the clipboard still costs a `getSize()` + `toBitmap()` + hash pass every
  poll tick, indefinitely. → **Mitigation**: none within this change; this
  is the accepted structural floor of polling without decision #7. Removing
  it further would require the native-addon approach explicitly set aside
  above.
- **[Risk]** `clipboard.clear()` destroys clipboard formats the plugin
  never inserted (e.g. accompanying text on an image-plus-text copy). →
  **Mitigation**: setting is off by default and images-only; settings copy
  states this plainly so it's an informed opt-in, not a surprise.
- **[Risk]** Non-cryptographic hash (FNV-1a or MD5) has a theoretically
  higher collision rate than SHA-256. → **Mitigation**: collision
  probability for either candidate is negligible for realistic clipboard
  image content and irrelevant from a security standpoint (no adversary);
  this is the correct trade for a change-detection use case.

## Migration Plan

No data migration — this changes in-memory dedupe state shape
(`ClipboardWatcher`'s `lastContent`) and adds one new persisted settings
field (the clear-after-insert toggle, defaulted `false` for existing
installs). No stored hashes persist across sessions today, so there's
nothing to migrate on upgrade. Rollback is a plain revert; no schema or
file-format changes are involved.

## Open Questions

- Final choice between hand-rolled FNV-1a and `crypto.createHash('md5')`
  for the non-cryptographic image hash — deferred to tasks/implementation;
  both satisfy the constraints here.
- Exact settings-tab copy/wording for the clear-after-insert tradeoff
  caveat — deferred to implementation, must cover both the all-formats
  caveat and the "recopy will re-insert" behavior.
