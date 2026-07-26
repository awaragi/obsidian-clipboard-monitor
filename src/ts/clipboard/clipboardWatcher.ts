import type { ClipboardReader } from "./clipboardReader";
import { hashText } from "./hash";

export type ClipboardWatcherCallback = (text: string) => void;

/**
 * Polls a ClipboardReader on an interval and invokes the callback only when
 * the read text's hash differs from the last-seen hash. `pollOnce` is public
 * so tests can drive the dedupe logic deterministically without real timers.
 */
export class ClipboardWatcher {
  private lastHash: string | null = null;
  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly reader: ClipboardReader,
    private readonly onNewText: ClipboardWatcherCallback,
    private readonly intervalMs = 400
  ) {}

  get isRunning(): boolean {
    return this.intervalId !== null;
  }

  pollOnce(): void {
    const text = this.reader.readText();
    if (!text) return;

    const hash = hashText(text);
    if (hash === this.lastHash) return;

    this.lastHash = hash;
    this.onNewText(text);
  }

  start(): void {
    if (this.isRunning) return;

    // Prime dedupe state with whatever is already on the clipboard so
    // starting watch mode doesn't immediately re-insert stale content.
    const current = this.reader.readText();
    this.lastHash = current ? hashText(current) : null;

    this.intervalId = setInterval(() => this.pollOnce(), this.intervalMs);
  }

  stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.lastHash = null;
  }
}
