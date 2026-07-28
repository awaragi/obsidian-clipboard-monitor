import { ClipboardWatcher, type ClipboardContent, type ClipboardWatcherCallback } from "../clipboard/clipboardWatcher";
import { t, type TranslationKey } from "../i18n/i18n";
import { noopLogger, type Logger } from "../logger";
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
  return t(CONTENT_TYPE_SCOPE_OPTIONS.find((option) => option.value === scope)!.labelKey);
}

type WatcherFactory = (onNewContent: ClipboardWatcherCallback, pollIntervalMs: number) => PollableWatcher;

/** Why a running session ended. Doubles as the `logger.info` reason and the lookup key into `STOP_REASON_KEYS`. */
export type WatchModeStopReason = "manual stop" | "restarting" | "note closed" | "note deleted" | "note moved";

const STOP_REASON_KEYS: Record<WatchModeStopReason, TranslationKey> = {
  "manual stop": "notice.stop_reason.manual",
  restarting: "notice.stop_reason.restarting",
  "note closed": "notice.stop_reason.note_closed",
  "note deleted": "notice.stop_reason.note_deleted",
  "note moved": "notice.stop_reason.note_moved",
};

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
  private readonly createWatcher: WatcherFactory;

  constructor(
    private readonly host: WatchModeHost,
    createWatcher?: WatcherFactory,
    private readonly logger: Logger = noopLogger
  ) {
    this.createWatcher =
      createWatcher ??
      ((onNewContent, pollIntervalMs) => new ClipboardWatcher(host.clipboardReader, onNewContent, pollIntervalMs, this.logger));
  }

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
    clearClipboardAfterImageInsert: boolean,
    pollIntervalMs: number
  ): void {
    if (this.isRunning) this.stop("restarting");

    this.target = target;
    this.scope = scope;
    this.format = format;
    this.clearClipboardAfterImageInsert = clearClipboardAfterImageInsert;

    this.watcher = this.createWatcher((content) => {
      this.handleNewContent(content).catch((error: unknown) => {
        this.logger.info("content handling failed", { error });
      });
    }, pollIntervalMs);
    this.watcher.start();

    this.workspaceRefs.push(this.host.onLayoutChange(() => this.checkStillOpen()));
    this.vaultRefs.push(
      this.host.onFileDeleted((path) => this.checkDeleted(path)),
      this.host.onFileRenamed((oldPath) => this.checkRenamed(oldPath))
    );

    this.logger.info("watch mode started", {
      target: target.basename,
      scope: scopeLabel(scope),
      format: format.name,
      pollIntervalMs,
    });

    this.host.onStatusChange({
      running: true,
      targetName: target.basename,
      scopeLabel: scopeLabel(scope),
      formatLabel: format.name,
    });

    this.host.notice(t("notice.started", { target: target.basename, scope: scopeLabel(scope), format: format.name }));
  }

  stop(reason: WatchModeStopReason = "manual stop"): void {
    if (!this.isRunning) return;

    this.logger.info("watch mode stopped", { target: this.target?.basename ?? null, reason });

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
    this.host.notice(t("notice.stopped", { reason: t(STOP_REASON_KEYS[reason]) }));
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
      this.logger.info("text inserted", { format: this.format.name, length: content.text.length });
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
    this.logger.info("image attachment saved", { link });
    // The session may have stopped or moved to a different target while
    // the save was in flight; discard the link rather than insert it
    // somewhere the user no longer expects it.
    if (this.target !== target) return;
    const editor = this.host.findMarkdownLeafForPath(target.path);
    if (!editor) return;
    insertText(editor, `${renderFormat(format.template, link)}\n`);
    this.logger.info("image inserted", { format: format.name, link });

    if (this.clearClipboardAfterImageInsert) {
      this.host.clearClipboard();
    }
  }

  private checkStillOpen(): void {
    if (!this.target) return;
    if (!this.host.findMarkdownLeafForPath(this.target.path)) {
      this.stop("note closed");
    }
  }

  private checkDeleted(path: string): void {
    if (this.target && path === this.target.path) {
      this.stop("note deleted");
    }
  }

  private checkRenamed(oldPath: string): void {
    if (this.target && oldPath === this.target.path) {
      this.stop("note moved");
    }
  }
}
