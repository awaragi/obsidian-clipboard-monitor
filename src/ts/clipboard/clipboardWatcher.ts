import type { ClipboardImage, ClipboardReader } from "./clipboardReader";
import { hashBufferFast, hashText } from "./hash";

export type ClipboardContent =
  | { type: "text"; text: string }
  | { type: "image"; width: number; height: number; bitmap: Buffer };

export type ClipboardWatcherCallback = (content: ClipboardContent) => void;

type LastContent = { type: "text"; hash: string } | { type: "image"; width: number; height: number; hash: string };

/**
 * Polls a ClipboardReader on an interval and invokes the callback only when
 * newly-read content's (type, hash) pair differs from the single last-seen
 * one — so switching from text to an image and back to that same text is
 * still detected as new, not just repeated identical content within the
 * same type. When both an image and text are present in the same tick, the
 * image takes priority and text is not checked that tick, so a single
 * clipboard change never produces two insertions. `pollOnce` is public so
 * tests can drive the dedupe logic deterministically without real timers.
 *
 * Image dedupe is staged: dimensions (free metadata) are compared first —
 * a mismatch is conclusive proof of new content, so the (comparatively
 * expensive) bitmap hash is only computed when dimensions match and the
 * hash is actually needed to confirm content equality.
 */
export class ClipboardWatcher {
  private lastContent: LastContent | null = null;
  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly reader: ClipboardReader,
    private readonly onNewContent: ClipboardWatcherCallback,
    private readonly intervalMs = 400
  ) {}

  get isRunning(): boolean {
    return this.intervalId !== null;
  }

  pollOnce(): void {
    const image = this.reader.readImage();
    if (image) {
      this.handleImage(image);
      return;
    }

    const text = this.reader.readText();
    if (!text) return;

    const hash = hashText(text);
    if (this.isNewText(hash)) {
      this.lastContent = { type: "text", hash };
      this.onNewContent({ type: "text", text });
    }
  }

  start(): void {
    if (this.isRunning) return;

    // Prime dedupe state with whatever is already on the clipboard so
    // starting watch mode doesn't immediately re-insert stale content.
    const currentImage = this.reader.readImage();
    if (currentImage) {
      this.lastContent = {
        type: "image",
        width: currentImage.width,
        height: currentImage.height,
        hash: hashBufferFast(currentImage.bitmap),
      };
    } else {
      const currentText = this.reader.readText();
      this.lastContent = currentText ? { type: "text", hash: hashText(currentText) } : null;
    }

    this.intervalId = setInterval(() => this.pollOnce(), this.intervalMs);
  }

  stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.lastContent = null;
  }

  private handleImage(image: ClipboardImage): void {
    const last = this.lastContent;
    const dimensionsMatch = last?.type === "image" && last.width === image.width && last.height === image.height;

    // Dimensions differing from the last-seen image is conclusive proof of
    // new content — no need to hash to decide. The hash is still computed
    // here (once, only for genuinely new content) to seed comparisons for
    // subsequent ticks.
    if (!dimensionsMatch) {
      const hash = hashBufferFast(image.bitmap);
      this.lastContent = { type: "image", width: image.width, height: image.height, hash };
      this.onNewContent({ type: "image", width: image.width, height: image.height, bitmap: image.bitmap });
      return;
    }

    const hash = hashBufferFast(image.bitmap);
    if (last.hash !== hash) {
      this.lastContent = { type: "image", width: image.width, height: image.height, hash };
      this.onNewContent({ type: "image", width: image.width, height: image.height, bitmap: image.bitmap });
    }
  }

  private isNewText(hash: string): boolean {
    return !this.lastContent || this.lastContent.type !== "text" || this.lastContent.hash !== hash;
  }
}
