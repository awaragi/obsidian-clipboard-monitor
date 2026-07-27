import { describe, expect, it, vi } from "vitest";
import { WatchModeController } from "./watchModeController";
import type { ClipboardContent } from "../clipboard/clipboardWatcher";
import type { ClipboardImage, ClipboardReader } from "../clipboard/clipboardReader";
import type { EditorLike, EditorPositionLike, PollableWatcher, WatchModeHost } from "./types";

/** Captures the onNewContent callback so tests can trigger clipboard "detections" directly, with no real timers. */
function fakeWatcherFactory() {
  let onNewContent: (content: ClipboardContent) => void | Promise<void> = () => {};
  const watcher: PollableWatcher = { start: vi.fn(), stop: vi.fn() };
  return {
    createWatcher: (cb: (content: ClipboardContent) => void) => {
      onNewContent = cb;
      return watcher;
    },
    trigger: (content: ClipboardContent) => onNewContent(content),
    triggerText: (text: string) => onNewContent({ type: "text", text }),
    triggerImage: (bitmap: Buffer) => onNewContent({ type: "image", width: 1, height: 1, bitmap }),
  };
}

function fakeEditor(): EditorLike & { text: string } {
  let cursor: EditorPositionLike = { line: 0, ch: 0 };
  const state = {
    text: "",
    getCursor: () => cursor,
    replaceRange: (text: string, from: EditorPositionLike) => {
      state.text += text;
      void from;
    },
    setCursor: (pos: EditorPositionLike) => {
      cursor = pos;
    },
  };
  return state;
}

function fakeHost(reader: ClipboardReader) {
  const editors = new Map<string, EditorLike>();
  const layoutChangeCallbacks: (() => void)[] = [];
  const deletedCallbacks: ((path: string) => void)[] = [];
  const renamedCallbacks: ((oldPath: string) => void)[] = [];
  const offWorkspace = vi.fn();
  const offVault = vi.fn();
  const notice = vi.fn();
  const onStatusChange = vi.fn();
  const saveImageAttachment = vi.fn(async (_data: Buffer, _sourcePath: string) => "![[Pasted image.png]]");
  const clearClipboard = vi.fn();

  const host: WatchModeHost = {
    clipboardReader: reader,
    findMarkdownLeafForPath: (path) => editors.get(path),
    onLayoutChange: (cb) => {
      layoutChangeCallbacks.push(cb);
      return cb;
    },
    onFileDeleted: (cb) => {
      deletedCallbacks.push(cb);
      return cb;
    },
    onFileRenamed: (cb) => {
      renamedCallbacks.push(cb);
      return cb;
    },
    offWorkspace,
    offVault,
    notice,
    onStatusChange,
    saveImageAttachment,
    clearClipboard,
  };

  return {
    host,
    editors,
    offWorkspace,
    offVault,
    notice,
    onStatusChange,
    saveImageAttachment,
    clearClipboard,
    triggerLayoutChange: () => layoutChangeCallbacks.forEach((cb) => cb()),
    triggerDeleted: (path: string) => deletedCallbacks.forEach((cb) => cb(path)),
    triggerRenamed: (oldPath: string) => renamedCallbacks.forEach((cb) => cb(oldPath)),
  };
}

function fakeReader(initial = ""): ClipboardReader & { set(text: string): void } {
  let text = initial;
  return {
    readText: () => text,
    readImage: () => null,
    encodeImageToPng: (image: ClipboardImage) => image.bitmap,
    clear: () => {},
    set: (next: string) => {
      text = next;
    },
  };
}

describe("WatchModeController", () => {
  const target = { path: "notes/Target.md", basename: "Target" };
  const rawFormat = { id: "raw", name: "Raw", template: "{{content}}" };
  const bulletFormat = { id: "bullet", name: "Bullet", template: "- {{content}}" };
  const timestampedFormat = { id: "timestamped", name: "Timestamped", template: "**{{time}}** — {{content}}" };

  it("reports running state and target name on start", () => {
    const { host, onStatusChange } = fakeHost(fakeReader());
    const controller = new WatchModeController(host, 10_000);

    controller.start(target, "both", rawFormat);

    expect(controller.isRunning).toBe(true);
    expect(onStatusChange).toHaveBeenCalledWith({
      running: true,
      targetName: "Target",
      scopeLabel: "Both",
      formatLabel: "Raw",
    });
  });

  it("reports stopped state on stop and unregisters listeners", () => {
    const { host, onStatusChange, offWorkspace, offVault } = fakeHost(fakeReader());
    const controller = new WatchModeController(host, 10_000);

    controller.start(target, "both", rawFormat);
    controller.stop();

    expect(controller.isRunning).toBe(false);
    expect(onStatusChange).toHaveBeenLastCalledWith({
      running: false,
      targetName: null,
      scopeLabel: null,
      formatLabel: null,
    });
    expect(offWorkspace).toHaveBeenCalledTimes(1);
    expect(offVault).toHaveBeenCalledTimes(2);
  });

  it("stop() is a safe no-op when not running", () => {
    const { host, onStatusChange } = fakeHost(fakeReader());
    const controller = new WatchModeController(host, 10_000);

    expect(() => controller.stop()).not.toThrow();
    expect(onStatusChange).not.toHaveBeenCalled();
  });

  it("inserts newly detected clipboard text followed by a newline", () => {
    const { host, editors } = fakeHost(fakeReader());
    const editor = fakeEditor();
    editors.set(target.path, editor);
    const { createWatcher, triggerText } = fakeWatcherFactory();

    const controller = new WatchModeController(host, 10_000, createWatcher);
    controller.start(target, "both", rawFormat);
    triggerText("pasted content");

    expect(editor.text).toBe("pasted content\n");
  });

  it("lands consecutive entries on their own line, not run together", () => {
    const { host, editors } = fakeHost(fakeReader());
    const editor = fakeEditor();
    editors.set(target.path, editor);
    const { createWatcher, triggerText } = fakeWatcherFactory();

    const controller = new WatchModeController(host, 10_000, createWatcher);
    controller.start(target, "both", rawFormat);
    triggerText("first");
    triggerText("second");

    expect(editor.text).toBe("first\nsecond\n");
  });

  it("renders the active format's template around inserted text", () => {
    const { host, editors } = fakeHost(fakeReader());
    const editor = fakeEditor();
    editors.set(target.path, editor);
    const { createWatcher, triggerText } = fakeWatcherFactory();

    const controller = new WatchModeController(host, 10_000, createWatcher);
    controller.start(target, "both", bulletFormat);
    triggerText("pasted content");

    expect(editor.text).toBe("- pasted content\n");
  });

  it("lands consecutive entries on their own line under a non-Raw format", () => {
    const { host, editors } = fakeHost(fakeReader());
    const editor = fakeEditor();
    editors.set(target.path, editor);
    const { createWatcher, triggerText } = fakeWatcherFactory();

    const controller = new WatchModeController(host, 10_000, createWatcher);
    controller.start(target, "both", bulletFormat);
    triggerText("first");
    triggerText("second");

    expect(editor.text).toBe("- first\n- second\n");
  });

  it("does not insert or throw when the target note isn't open in any pane", () => {
    const { host } = fakeHost(fakeReader()); // no editors registered
    const { createWatcher, triggerText } = fakeWatcherFactory();

    const controller = new WatchModeController(host, 10_000, createWatcher);
    controller.start(target, "both", rawFormat);

    expect(() => triggerText("pasted content")).not.toThrow();
  });

  it("inserts text when scope is 'text'", () => {
    const { host, editors } = fakeHost(fakeReader());
    const editor = fakeEditor();
    editors.set(target.path, editor);
    const { createWatcher, triggerText } = fakeWatcherFactory();

    const controller = new WatchModeController(host, 10_000, createWatcher);
    controller.start(target, "text", rawFormat);
    triggerText("pasted content");

    expect(editor.text).toBe("pasted content\n");
  });

  it("blocks text insertion when scope is 'image'", () => {
    const { host, editors } = fakeHost(fakeReader());
    const editor = fakeEditor();
    editors.set(target.path, editor);
    const { createWatcher, triggerText } = fakeWatcherFactory();

    const controller = new WatchModeController(host, 10_000, createWatcher);
    controller.start(target, "image", rawFormat);
    triggerText("pasted content");

    expect(editor.text).toBe("");
  });

  it("saves and inserts a link for newly detected image content under scope 'both'", async () => {
    const { host, editors, saveImageAttachment } = fakeHost(fakeReader());
    const editor = fakeEditor();
    editors.set(target.path, editor);
    const { createWatcher, triggerImage } = fakeWatcherFactory();
    const data = Buffer.from([1, 2, 3]);

    const controller = new WatchModeController(host, 10_000, createWatcher);
    controller.start(target, "both", rawFormat);
    await triggerImage(data);

    expect(saveImageAttachment).toHaveBeenCalledWith(data, target.path);
    expect(editor.text).toBe("![[Pasted image.png]]\n");
  });

  it("saves and inserts a link for newly detected image content under scope 'image'", async () => {
    const { host, editors } = fakeHost(fakeReader());
    const editor = fakeEditor();
    editors.set(target.path, editor);
    const { createWatcher, triggerImage } = fakeWatcherFactory();

    const controller = new WatchModeController(host, 10_000, createWatcher);
    controller.start(target, "image", rawFormat);
    await triggerImage(Buffer.from([1, 2, 3]));

    expect(editor.text).toBe("![[Pasted image.png]]\n");
  });

  it("applies the active format to an inserted image link", async () => {
    const { host, editors } = fakeHost(fakeReader());
    const editor = fakeEditor();
    editors.set(target.path, editor);
    const { createWatcher, triggerImage } = fakeWatcherFactory();

    const controller = new WatchModeController(host, 10_000, createWatcher);
    controller.start(target, "both", bulletFormat);
    await triggerImage(Buffer.from([1, 2, 3]));

    expect(editor.text).toBe("- ![[Pasted image.png]]\n");
  });

  it("substitutes {{time}} for an inserted image link under the Timestamped format", async () => {
    const { host, editors } = fakeHost(fakeReader());
    const editor = fakeEditor();
    editors.set(target.path, editor);
    const { createWatcher, triggerImage } = fakeWatcherFactory();

    const controller = new WatchModeController(host, 10_000, createWatcher);
    controller.start(target, "both", timestampedFormat);
    await triggerImage(Buffer.from([1, 2, 3]));

    expect(editor.text).toMatch(/^\*\*\d{2}:\d{2}\*\* — !\[\[Pasted image\.png\]\]\n$/);
  });

  it("blocks image insertion when scope is 'text'", async () => {
    const { host, editors, saveImageAttachment } = fakeHost(fakeReader());
    const editor = fakeEditor();
    editors.set(target.path, editor);
    const { createWatcher, triggerImage } = fakeWatcherFactory();

    const controller = new WatchModeController(host, 10_000, createWatcher);
    controller.start(target, "text", rawFormat);
    await triggerImage(Buffer.from([1, 2, 3]));

    expect(saveImageAttachment).not.toHaveBeenCalled();
    expect(editor.text).toBe("");
  });

  it("does not insert the link if the target changes while the save is in flight", async () => {
    const { host, editors, clearClipboard } = fakeHost(fakeReader());
    const editor = fakeEditor();
    editors.set(target.path, editor);
    let resolveSave: (link: string) => void = () => {};
    host.saveImageAttachment = vi.fn(
      () =>
        new Promise<string>((resolve) => {
          resolveSave = resolve;
        })
    );
    const { createWatcher, triggerImage } = fakeWatcherFactory();

    const controller = new WatchModeController(host, 10_000, createWatcher);
    controller.start(target, "both", rawFormat, true);
    const pending = triggerImage(Buffer.from([1, 2, 3]));
    controller.stop(); // target changes to null while the save is still pending
    resolveSave("![[Pasted image.png]]");
    await pending;

    expect(editor.text).toBe("");
    expect(clearClipboard).not.toHaveBeenCalled();
  });

  it("clears the clipboard after a successful image insert when the setting is enabled", async () => {
    const { host, editors, clearClipboard } = fakeHost(fakeReader());
    const editor = fakeEditor();
    editors.set(target.path, editor);
    const { createWatcher, triggerImage } = fakeWatcherFactory();

    const controller = new WatchModeController(host, 10_000, createWatcher);
    controller.start(target, "both", rawFormat, true);
    await triggerImage(Buffer.from([1, 2, 3]));

    expect(editor.text).toBe("![[Pasted image.png]]\n");
    expect(clearClipboard).toHaveBeenCalledTimes(1);
  });

  it("does not clear the clipboard after an image insert when the setting is disabled (default)", async () => {
    const { host, editors, clearClipboard } = fakeHost(fakeReader());
    const editor = fakeEditor();
    editors.set(target.path, editor);
    const { createWatcher, triggerImage } = fakeWatcherFactory();

    const controller = new WatchModeController(host, 10_000, createWatcher);
    controller.start(target, "both", rawFormat);
    await triggerImage(Buffer.from([1, 2, 3]));

    expect(editor.text).toBe("![[Pasted image.png]]\n");
    expect(clearClipboard).not.toHaveBeenCalled();
  });

  it("does not clear the clipboard when the image save fails", async () => {
    const { host, editors, clearClipboard } = fakeHost(fakeReader());
    const editor = fakeEditor();
    editors.set(target.path, editor);
    host.saveImageAttachment = vi.fn(async () => {
      throw new Error("save failed");
    });
    const { createWatcher, triggerImage } = fakeWatcherFactory();

    const controller = new WatchModeController(host, 10_000, createWatcher);
    controller.start(target, "both", rawFormat, true);
    await expect(triggerImage(Buffer.from([1, 2, 3]))).rejects.toThrow("save failed");

    expect(editor.text).toBe("");
    expect(clearClipboard).not.toHaveBeenCalled();
  });

  it("never clears the clipboard for a text insertion, even when the setting is enabled", () => {
    const { host, editors, clearClipboard } = fakeHost(fakeReader());
    const editor = fakeEditor();
    editors.set(target.path, editor);
    const { createWatcher, triggerText } = fakeWatcherFactory();

    const controller = new WatchModeController(host, 10_000, createWatcher);
    controller.start(target, "both", rawFormat, true);
    triggerText("pasted content");

    expect(editor.text).toBe("pasted content\n");
    expect(clearClipboard).not.toHaveBeenCalled();
  });

  it("auto-stops with a notice when the target note is no longer open", () => {
    const { host, notice, triggerLayoutChange } = fakeHost(fakeReader());
    const controller = new WatchModeController(host, 10_000);

    controller.start(target, "both", rawFormat); // no editor registered -> "closed"
    triggerLayoutChange();

    expect(controller.isRunning).toBe(false);
    expect(notice).toHaveBeenCalledWith(expect.stringContaining("note closed"));
  });

  it("does not stop on layout-change while the target note is still open", () => {
    const { host, editors, notice, triggerLayoutChange } = fakeHost(fakeReader());
    editors.set(target.path, fakeEditor());
    const controller = new WatchModeController(host, 10_000);

    controller.start(target, "both", rawFormat);
    triggerLayoutChange();

    expect(controller.isRunning).toBe(true);
    expect(notice).not.toHaveBeenCalled();
  });

  it("auto-stops with a notice when the target note is deleted", () => {
    const { host, notice, triggerDeleted } = fakeHost(fakeReader());
    const controller = new WatchModeController(host, 10_000);

    controller.start(target, "both", rawFormat);
    triggerDeleted(target.path);

    expect(controller.isRunning).toBe(false);
    expect(notice).toHaveBeenCalledWith(expect.stringContaining("note deleted"));
  });

  it("ignores deletion of an unrelated file", () => {
    const { host, notice, triggerDeleted } = fakeHost(fakeReader());
    const controller = new WatchModeController(host, 10_000);

    controller.start(target, "both", rawFormat);
    triggerDeleted("notes/Other.md");

    expect(controller.isRunning).toBe(true);
    expect(notice).not.toHaveBeenCalled();
  });

  it("auto-stops with a notice when the target note is renamed or moved", () => {
    const { host, notice, triggerRenamed } = fakeHost(fakeReader());
    const controller = new WatchModeController(host, 10_000);

    controller.start(target, "both", rawFormat);
    triggerRenamed(target.path);

    expect(controller.isRunning).toBe(false);
    expect(notice).toHaveBeenCalledWith(expect.stringContaining("note moved"));
  });

  it("starting a new session while running stops the previous one first", () => {
    const { host, onStatusChange } = fakeHost(fakeReader());
    const controller = new WatchModeController(host, 10_000);
    const other = { path: "notes/Other.md", basename: "Other" };

    controller.start(target, "text", rawFormat);
    controller.start(other, "image", rawFormat);

    expect(controller.currentTarget).toEqual(other);
    expect(onStatusChange.mock.calls.map((call) => call[0])).toEqual([
      { running: true, targetName: "Target", scopeLabel: "Text only", formatLabel: "Raw" },
      { running: false, targetName: null, scopeLabel: null, formatLabel: null },
      { running: true, targetName: "Other", scopeLabel: "Images only", formatLabel: "Raw" },
    ]);
  });
});
