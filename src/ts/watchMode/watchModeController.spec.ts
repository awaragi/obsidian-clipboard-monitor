import { describe, expect, it, vi } from "vitest";
import { WatchModeController } from "./watchModeController";
import type { ClipboardReader } from "../clipboard/clipboardReader";
import type { EditorLike, EditorPositionLike, PollableWatcher, WatchModeHost } from "./types";

/** Captures the onNewText callback so tests can trigger clipboard "detections" directly, with no real timers. */
function fakeWatcherFactory() {
  let onNewText: (text: string) => void = () => {};
  const watcher: PollableWatcher = { start: vi.fn(), stop: vi.fn() };
  return {
    createWatcher: (cb: (text: string) => void) => {
      onNewText = cb;
      return watcher;
    },
    trigger: (text: string) => onNewText(text),
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
  };

  return {
    host,
    editors,
    offWorkspace,
    offVault,
    notice,
    onStatusChange,
    triggerLayoutChange: () => layoutChangeCallbacks.forEach((cb) => cb()),
    triggerDeleted: (path: string) => deletedCallbacks.forEach((cb) => cb(path)),
    triggerRenamed: (oldPath: string) => renamedCallbacks.forEach((cb) => cb(oldPath)),
  };
}

function fakeReader(initial = ""): ClipboardReader & { set(text: string): void } {
  let text = initial;
  return {
    readText: () => text,
    set: (next: string) => {
      text = next;
    },
  };
}

describe("WatchModeController", () => {
  const target = { path: "notes/Target.md", basename: "Target" };
  const rawFormat = { id: "raw", name: "Raw", template: "{{content}}" };
  const bulletFormat = { id: "bullet", name: "Bullet", template: "- {{content}}" };

  it("reports running state and target name on start", () => {
    const { host, onStatusChange } = fakeHost(fakeReader());
    const controller = new WatchModeController(host, 10_000);

    controller.start(target, "both", rawFormat);

    expect(controller.isRunning).toBe(true);
    expect(onStatusChange).toHaveBeenCalledWith({
      running: true,
      targetName: "Target",
      scopeLabel: "Both",
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
    const { createWatcher, trigger } = fakeWatcherFactory();

    const controller = new WatchModeController(host, 10_000, createWatcher);
    controller.start(target, "both", rawFormat);
    trigger("pasted content");

    expect(editor.text).toBe("pasted content\n");
  });

  it("lands consecutive entries on their own line, not run together", () => {
    const { host, editors } = fakeHost(fakeReader());
    const editor = fakeEditor();
    editors.set(target.path, editor);
    const { createWatcher, trigger } = fakeWatcherFactory();

    const controller = new WatchModeController(host, 10_000, createWatcher);
    controller.start(target, "both", rawFormat);
    trigger("first");
    trigger("second");

    expect(editor.text).toBe("first\nsecond\n");
  });

  it("renders the active format's template around inserted text", () => {
    const { host, editors } = fakeHost(fakeReader());
    const editor = fakeEditor();
    editors.set(target.path, editor);
    const { createWatcher, trigger } = fakeWatcherFactory();

    const controller = new WatchModeController(host, 10_000, createWatcher);
    controller.start(target, "both", bulletFormat);
    trigger("pasted content");

    expect(editor.text).toBe("- pasted content\n");
  });

  it("lands consecutive entries on their own line under a non-Raw format", () => {
    const { host, editors } = fakeHost(fakeReader());
    const editor = fakeEditor();
    editors.set(target.path, editor);
    const { createWatcher, trigger } = fakeWatcherFactory();

    const controller = new WatchModeController(host, 10_000, createWatcher);
    controller.start(target, "both", bulletFormat);
    trigger("first");
    trigger("second");

    expect(editor.text).toBe("- first\n- second\n");
  });

  it("does not insert or throw when the target note isn't open in any pane", () => {
    const { host } = fakeHost(fakeReader()); // no editors registered
    const { createWatcher, trigger } = fakeWatcherFactory();

    const controller = new WatchModeController(host, 10_000, createWatcher);
    controller.start(target, "both", rawFormat);

    expect(() => trigger("pasted content")).not.toThrow();
  });

  it("inserts text when scope is 'text'", () => {
    const { host, editors } = fakeHost(fakeReader());
    const editor = fakeEditor();
    editors.set(target.path, editor);
    const { createWatcher, trigger } = fakeWatcherFactory();

    const controller = new WatchModeController(host, 10_000, createWatcher);
    controller.start(target, "text", rawFormat);
    trigger("pasted content");

    expect(editor.text).toBe("pasted content\n");
  });

  it("blocks text insertion when scope is 'image'", () => {
    const { host, editors } = fakeHost(fakeReader());
    const editor = fakeEditor();
    editors.set(target.path, editor);
    const { createWatcher, trigger } = fakeWatcherFactory();

    const controller = new WatchModeController(host, 10_000, createWatcher);
    controller.start(target, "image", rawFormat);
    trigger("pasted content");

    expect(editor.text).toBe("");
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
      { running: true, targetName: "Target", scopeLabel: "Text only" },
      { running: false, targetName: null, scopeLabel: null },
      { running: true, targetName: "Other", scopeLabel: "Images only" },
    ]);
  });
});
