import { App, MarkdownView, Notice, TAbstractFile } from "obsidian";
import type { ClipboardReader } from "../clipboard/clipboardReader";
import { generateAttachmentFilename } from "./attachmentFilename";
import type { EditorLike, WatchModeHost, WatchModeStatus } from "./types";

function toArrayBuffer(data: Buffer): ArrayBuffer {
  return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
}

/** Adapts a real Obsidian App + clipboard reader into the WatchModeHost seam. */
export function createObsidianHost(
  app: App,
  clipboardReader: ClipboardReader,
  onStatusChange: (status: WatchModeStatus) => void
): WatchModeHost {
  return {
    clipboardReader,

    findMarkdownLeafForPath(path: string): EditorLike | undefined {
      for (const leaf of app.workspace.getLeavesOfType("markdown")) {
        if (leaf.view instanceof MarkdownView && leaf.view.file?.path === path) {
          return leaf.view.editor;
        }
      }
      return undefined;
    },

    onLayoutChange(callback: () => void) {
      return app.workspace.on("layout-change", callback);
    },

    onFileDeleted(callback: (path: string) => void) {
      return app.vault.on("delete", (file: TAbstractFile) => callback(file.path));
    },

    onFileRenamed(callback: (oldPath: string) => void) {
      return app.vault.on("rename", (_file: TAbstractFile, oldPath: string) => callback(oldPath));
    },

    offWorkspace(ref) {
      app.workspace.offref(ref as Parameters<typeof app.workspace.offref>[0]);
    },

    offVault(ref) {
      app.vault.offref(ref as Parameters<typeof app.vault.offref>[0]);
    },

    notice(message: string) {
      new Notice(message);
    },

    onStatusChange,

    async saveImageAttachment(data: Buffer, sourcePath: string): Promise<string> {
      const filename = generateAttachmentFilename();
      const path = await app.fileManager.getAvailablePathForAttachment(filename, sourcePath);
      const file = await app.vault.createBinary(path, toArrayBuffer(data));
      // generateMarkdownLink only controls link style (wikilink vs. markdown,
      // path style); it doesn't add the embed prefix. Every attachment saved
      // here is an image, so the embed form is always correct, matching what
      // a normal manual paste produces.
      return `!${app.fileManager.generateMarkdownLink(file, sourcePath)}`;
    },

    clearClipboard() {
      clipboardReader.clear();
    },
  };
}
