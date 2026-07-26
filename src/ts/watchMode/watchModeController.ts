import { ClipboardWatcher, type ClipboardWatcherCallback } from "../clipboard/clipboardWatcher";
import { CONTENT_TYPE_SCOPE_OPTIONS, shouldInsertText, type ContentTypeScope } from "./contentTypeScope";
import { insertText } from "./insertText";
import type { PollableWatcher, WatchModeEventRef, WatchModeHost, WatchModeTarget } from "./types";

function scopeLabel(scope: ContentTypeScope): string {
  return CONTENT_TYPE_SCOPE_OPTIONS.find((option) => option.value === scope)!.label;
}

const DEFAULT_POLL_INTERVAL_MS = 400;

type WatcherFactory = (onNewText: ClipboardWatcherCallback) => PollableWatcher;

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
  private workspaceRefs: WatchModeEventRef[] = [];
  private vaultRefs: WatchModeEventRef[] = [];

  constructor(
    private readonly host: WatchModeHost,
    private readonly pollIntervalMs = DEFAULT_POLL_INTERVAL_MS,
    private readonly createWatcher: WatcherFactory = (onNewText) =>
      new ClipboardWatcher(host.clipboardReader, onNewText, pollIntervalMs)
  ) {}

  get isRunning(): boolean {
    return this.watcher !== null;
  }

  get currentTarget(): WatchModeTarget | null {
    return this.target;
  }

  start(target: WatchModeTarget, scope: ContentTypeScope): void {
    if (this.isRunning) this.stop();

    this.target = target;
    this.scope = scope;

    this.watcher = this.createWatcher((text) => this.handleNewText(text));
    this.watcher.start();

    this.workspaceRefs.push(this.host.onLayoutChange(() => this.checkStillOpen()));
    this.vaultRefs.push(
      this.host.onFileDeleted((path) => this.checkDeleted(path)),
      this.host.onFileRenamed((oldPath) => this.checkRenamed(oldPath))
    );

    this.host.onStatusChange({ running: true, targetName: target.basename, scopeLabel: scopeLabel(scope) });
  }

  stop(): void {
    if (!this.isRunning) return;

    this.watcher?.stop();
    this.watcher = null;
    this.target = null;
    this.scope = null;

    for (const ref of this.workspaceRefs) this.host.offWorkspace(ref);
    for (const ref of this.vaultRefs) this.host.offVault(ref);
    this.workspaceRefs = [];
    this.vaultRefs = [];

    this.host.onStatusChange({ running: false, targetName: null, scopeLabel: null });
  }

  private handleNewText(text: string): void {
    if (!this.target || !this.scope) return;
    if (!shouldInsertText(this.scope)) return;
    const editor = this.host.findMarkdownLeafForPath(this.target.path);
    if (!editor) return;
    // Trailing newline so consecutive clipboard entries land on their own
    // line instead of running together; revisit once Phase 4's format
    // templates replace this with a user-selected {{content}} template.
    insertText(editor, `${text}\n`);
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
