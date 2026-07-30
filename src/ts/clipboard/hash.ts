import { createHash as nodeCreateHash } from "crypto";

/** Minimal, self-contained shape for what this module needs from Node's `Hash` — kept independent of `crypto`'s own (ambient Node-types-dependent) declarations. */
interface Digest {
  update(data: string | Uint8Array): Digest;
  digest(encoding: "hex"): string;
}

const createHash = nodeCreateHash as (algorithm: string) => Digest;

export function hashText(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

export function hashBuffer(data: Uint8Array): string {
  return createHash("sha256").update(data).digest("hex");
}

/**
 * Fast, non-cryptographic buffer hash for change detection (e.g. image
 * bitmaps hashed on every poll tick). No collision-resistance guarantee —
 * only appropriate where the goal is "did the bytes change," not defending
 * against a deliberate adversary.
 */
export function hashBufferFast(data: Uint8Array): string {
  return createHash("md5").update(data).digest("hex");
}
