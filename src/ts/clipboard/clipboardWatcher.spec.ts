import { describe, expect, it, vi } from "vitest";
import { ClipboardWatcher } from "./clipboardWatcher";
import type { ClipboardReader } from "./clipboardReader";

function fakeReader(initial = ""): ClipboardReader & { set(text: string): void } {
  let text = initial;
  return {
    readText: () => text,
    set: (next: string) => {
      text = next;
    },
  };
}

describe("ClipboardWatcher", () => {
  it("detects new text exactly once", () => {
    const reader = fakeReader();
    const onNewText = vi.fn();
    const watcher = new ClipboardWatcher(reader, onNewText);

    reader.set("hello");
    watcher.pollOnce();
    watcher.pollOnce();

    expect(onNewText).toHaveBeenCalledTimes(1);
    expect(onNewText).toHaveBeenCalledWith("hello");
  });

  it("ignores repeated identical content across polls", () => {
    const reader = fakeReader("hello");
    const onNewText = vi.fn();
    const watcher = new ClipboardWatcher(reader, onNewText);

    watcher.pollOnce();
    watcher.pollOnce();
    watcher.pollOnce();

    expect(onNewText).toHaveBeenCalledTimes(1);
  });

  it("detects a second, different entry after the first", () => {
    const reader = fakeReader("first");
    const onNewText = vi.fn();
    const watcher = new ClipboardWatcher(reader, onNewText);

    watcher.pollOnce();
    reader.set("second");
    watcher.pollOnce();

    expect(onNewText).toHaveBeenCalledTimes(2);
    expect(onNewText).toHaveBeenNthCalledWith(1, "first");
    expect(onNewText).toHaveBeenNthCalledWith(2, "second");
  });

  it("ignores empty clipboard content (e.g. an image with no text)", () => {
    const reader = fakeReader("");
    const onNewText = vi.fn();
    const watcher = new ClipboardWatcher(reader, onNewText);

    watcher.pollOnce();

    expect(onNewText).not.toHaveBeenCalled();
  });

  it("start() primes dedupe with content already on the clipboard", () => {
    const reader = fakeReader("already there");
    const onNewText = vi.fn();
    const watcher = new ClipboardWatcher(reader, onNewText, 10_000);

    watcher.start();
    watcher.pollOnce();
    watcher.stop();

    expect(onNewText).not.toHaveBeenCalled();
  });

  it("stop() resets dedupe state so a restart can re-detect the same content", () => {
    const reader = fakeReader("hello");
    const onNewText = vi.fn();
    const watcher = new ClipboardWatcher(reader, onNewText, 10_000);

    watcher.pollOnce();
    watcher.stop();
    watcher.pollOnce();

    expect(onNewText).toHaveBeenCalledTimes(2);
  });
});
