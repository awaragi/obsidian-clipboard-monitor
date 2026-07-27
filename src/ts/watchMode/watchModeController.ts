import { ClipboardWatcher, type ClipboardContent, type ClipboardWatcherCallback } from "../clipboard/clipboardWatcher";
import {
  CONTENT_TYPE_SCOPE_OPTIONS,
  shouldInsertImage,
  shouldInsertText,
  type ContentTypeScope,
} from "./contentTypeScope";
import { insertText } from "./insertText";
import { renderFormat, type TextFormat } from "./textFormat";
import type { PollableWatcher, WatchModeEventRef, WatchModeHost, WatchModeTarget } from "./types";

function scopeLabel(scope: ContentTypeScope): string {
  return CONTENT_TYPE_SCOPE_OPTIONS.find((option) => option.value === scope)!.label;
}

const DEFAULT_POLL_INTERVAL_MS = 400;

type WatcherFactory = (onNewContent: ClipboardWatcherCallback) => PollableWatcher;

/**
 * Orchestrates a single watch-mode session: starts/stops the clipboard
 * watcher, inserts new text into the pinned target note, and auto-stops
 * when that note closes, is deleted, or is renamed/moved. Depends only on
 * the WatchModeHost seam (and an injectable watcher factory), so it can be
 * unit-tested without a real Obsidian App or real timers.
 */
export class WatchModeController {
  private watcher: PollableWatcher | null = null;
  private target: WatchModeTarget | null = null;
  private scope: ContentTypeScope | null = null;
  private format: TextFormat | null = null;
  private clearClipboardAfterImageInsert = false;
  private workspaceRefs: WatchModeEventRef[] = [];
  private vaultRefs: WatchModeEventRef[] = [];

  constructor(
    private readonly host: WatchModeHost,
    private readonly pollIntervalMs = DEFAULT_POLL_INTERVAL_MS,
    private readonly createWatcher: WatcherFactory = (onNewContent) =>
      new ClipboardWatcher(host.clipboardReader, onNewContent, pollIntervalMs)
  ) {}

  get isRunning(): boolean {
    return this.watcher !== null;
  }

  get currentTarget(): WatchModeTarget | null {
    return this.target;
  }

  start(
    target: WatchModeTarget,
    scope: ContentTypeScope,
    format: TextFormat,
    clearClipboardAfterImageInsert = false
  ): void {
    if (this.isRunning) this.stop();

    this.target = target;
    this.scope = scope;
    this.format = format;
    this.clearClipboardAfterImageInsert = clearClipboardAfterImageInsert;

    this.watcher = this.createWatcher((content) => this.handleNewContent(content));
    this.watcher.start();

    this.workspaceRefs.push(this.host.onLayoutChange(() => this.checkStillOpen()));
    this.vaultRefs.push(
      this.host.onFileDeleted((path) => this.checkDeleted(path)),
      this.host.onFileRenamed((oldPath) => this.checkRenamed(oldPath))
    );

    this.host.onStatusChange({
      running: true,
      targetName: target.basename,
      scopeLabel: scopeLabel(scope),
      formatLabel: format.name,
    });
  }

  stop(): void {
    if (!this.isRunning) return;

    this.watcher?.stop();
    this.watcher = null;
    this.target = null;
    this.scope = null;
    this.format = null;
    this.clearClipboardAfterImageInsert = false;

    for (const ref of this.workspaceRefs) this.host.offWorkspace(ref);
    for (const ref of this.vaultRefs) this.host.offVault(ref);
    this.workspaceRefs = [];
    this.vaultRefs = [];

    this.host.onStatusChange({ running: false, targetName: null, scopeLabel: null, formatLabel: null });
  }

  private async handleNewContent(content: ClipboardContent): Promise<void> {
    if (!this.target || !this.scope || !this.format) return;

    if (content.type === "text") {
      if (!shouldInsertText(this.scope)) return;
      const editor = this.host.findMarkdownLeafForPath(this.target.path);
      if (!editor) return;
      // Trailing newline appended once, after the rendered template, so
      // consecutive clipboard entries always land on their own line
      // regardless of what the active format's template contains.
      insertText(editor, `${renderFormat(this.format.template, content.text)}\n`);
      return;
    }

    if (!shouldInsertImage(this.scope)) return;
    const target = this.target;
    const format = this.format;
    const png = this.host.clipboardReader.encodeImageToPng({
      width: content.width,
      height: content.height,
      bitmap: content.bitmap,
    });
    const link = await this.host.saveImageAttachment(png, target.path);
    // The session may have stopped or moved to a different target while
    // the save was in flight; discard the link rather than insert it
    // somewhere the user no longer expects it.
    if (this.target !== target) return;
    const editor = this.host.findMarkdownLeafForPath(target.path);
    if (!editor) return;
    insertText(editor, `${renderFormat(format.template, link)}\n`);

    if (this.clearClipboardAfterImageInsert) {
      this.host.clearClipboard();
    }
  }

  private checkStillOpen(): void {
    if (!this.target) return;
    if (!this.host.findMarkdownLeafForPath(this.target.path)) {
      this.stopWithNotice("note closed");
    }
  }

  private checkDeleted(path: string): void {
    if (this.target && path === this.target.path) {
      this.stopWithNotice("note deleted");
    }
  }

  private checkRenamed(oldPath: string): void {
    if (this.target && oldPath === this.target.path) {
      this.stopWithNotice("note moved");
    }
  }

  private stopWithNotice(reason: string): void {
    this.host.notice(`Clipboard Monitor: watch mode stopped — ${reason}`);
    this.stop();
  }
}
