import type { ClipboardReader } from "../clipboard/clipboardReader";

export interface EditorPositionLike {
  line: number;
  ch: number;
}

/** The minimal slice of Obsidian's Editor API this plugin depends on. */
export interface EditorLike {
  getCursor(): EditorPositionLike;
  replaceRange(text: string, from: EditorPositionLike, to: EditorPositionLike): void;
  setCursor(pos: EditorPositionLike): void;
}

export interface WatchModeStatus {
  running: boolean;
  targetName: string | null;
}

export interface WatchModeTarget {
  path: string;
  basename: string;
}

/** The minimal shape WatchModeController needs from a clipboard watcher — lets tests inject a fake. */
export interface PollableWatcher {
  start(): void;
  stop(): void;
}

/** Opaque handle for an event subscription; only ever passed back to offWorkspace/offVault. */
export type WatchModeEventRef = unknown;

/**
 * Everything WatchModeController needs from the host environment, expressed
 * as plain, semantic operations rather than raw Obsidian types. Lets the
 * controller be unit-tested with a fake host and no real Obsidian App.
 */
export interface WatchModeHost {
  clipboardReader: ClipboardReader;

  /** Returns the editor for the note at `path` if it's open in some markdown pane, else undefined. */
  findMarkdownLeafForPath(path: string): EditorLike | undefined;

  onLayoutChange(callback: () => void): WatchModeEventRef;
  onFileDeleted(callback: (path: string) => void): WatchModeEventRef;
  onFileRenamed(callback: (oldPath: string) => void): WatchModeEventRef;

  offWorkspace(ref: WatchModeEventRef): void;
  offVault(ref: WatchModeEventRef): void;

  notice(message: string): void;
  onStatusChange(status: WatchModeStatus): void;
}
