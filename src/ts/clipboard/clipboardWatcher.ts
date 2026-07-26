import type { ClipboardReader } from "./clipboardReader";
import { hashBuffer, hashText } from "./hash";

export type ClipboardContent = { type: "text"; text: string } | { type: "image"; data: Buffer };

export type ClipboardWatcherCallback = (content: ClipboardContent) => void;

type LastContent = { type: "text" | "image"; hash: string };

/**
 * Polls a ClipboardReader on an interval and invokes the callback only when
 * newly-read content's (type, hash) pair differs from the single last-seen
 * one — so switching from text to an image and back to that same text is
 * still detected as new, not just repeated identical content within the
 * same type. When both an image and text are present in the same tick, the
 * image takes priority and text is not checked that tick, so a single
 * clipboard change never produces two insertions. `pollOnce` is public so
 * tests can drive the dedupe logic deterministically without real timers.
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
      const hash = hashBuffer(image);
      if (this.isNew("image", hash)) {
        this.lastContent = { type: "image", hash };
        this.onNewContent({ type: "image", data: image });
      }
      return;
    }

    const text = this.reader.readText();
    if (!text) return;

    const hash = hashText(text);
    if (this.isNew("text", hash)) {
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
      this.lastContent = { type: "image", hash: hashBuffer(currentImage) };
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

  private isNew(type: "text" | "image", hash: string): boolean {
    return !this.lastContent || this.lastContent.type !== type || this.lastContent.hash !== hash;
  }
}
