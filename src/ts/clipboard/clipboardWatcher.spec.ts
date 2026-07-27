import { describe, expect, it, vi } from "vitest";
import { ClipboardWatcher, type ClipboardContent } from "./clipboardWatcher";
import type { ClipboardImage, ClipboardReader } from "./clipboardReader";

function img(bitmap: Buffer, width = 1, height = 1): ClipboardImage {
  return { width, height, bitmap };
}

function fakeReader(
  initial = ""
): ClipboardReader & { set(text: string): void; setImage(image: ClipboardImage | null): void } {
  let text = initial;
  let image: ClipboardImage | null = null;
  return {
    readText: () => text,
    readImage: () => image,
    encodeImageToPng: (i) => i.bitmap,
    clear: () => {},
    set: (next: string) => {
      text = next;
    },
    setImage: (next: ClipboardImage | null) => {
      image = next;
    },
  };
}

describe("ClipboardWatcher", () => {
  it("detects new text exactly once", () => {
    const reader = fakeReader();
    const onNewContent = vi.fn();
    const watcher = new ClipboardWatcher(reader, onNewContent);

    reader.set("hello");
    watcher.pollOnce();
    watcher.pollOnce();

    expect(onNewContent).toHaveBeenCalledTimes(1);
    expect(onNewContent).toHaveBeenCalledWith({ type: "text", text: "hello" });
  });

  it("ignores repeated identical content across polls", () => {
    const reader = fakeReader("hello");
    const onNewContent = vi.fn();
    const watcher = new ClipboardWatcher(reader, onNewContent);

    watcher.pollOnce();
    watcher.pollOnce();
    watcher.pollOnce();

    expect(onNewContent).toHaveBeenCalledTimes(1);
  });

  it("detects a second, different entry after the first", () => {
    const reader = fakeReader("first");
    const onNewContent = vi.fn();
    const watcher = new ClipboardWatcher(reader, onNewContent);

    watcher.pollOnce();
    reader.set("second");
    watcher.pollOnce();

    expect(onNewContent).toHaveBeenCalledTimes(2);
    expect(onNewContent).toHaveBeenNthCalledWith(1, { type: "text", text: "first" });
    expect(onNewContent).toHaveBeenNthCalledWith(2, { type: "text", text: "second" });
  });

  it("ignores empty clipboard content (e.g. an image with no text)", () => {
    const reader = fakeReader("");
    const onNewContent = vi.fn();
    const watcher = new ClipboardWatcher(reader, onNewContent);

    watcher.pollOnce();

    expect(onNewContent).not.toHaveBeenCalled();
  });

  it("start() primes dedupe with content already on the clipboard", () => {
    const reader = fakeReader("already there");
    const onNewContent = vi.fn();
    const watcher = new ClipboardWatcher(reader, onNewContent, 10_000);

    watcher.start();
    watcher.pollOnce();
    watcher.stop();

    expect(onNewContent).not.toHaveBeenCalled();
  });

  it("stop() resets dedupe state so a restart can re-detect the same content", () => {
    const reader = fakeReader("hello");
    const onNewContent = vi.fn();
    const watcher = new ClipboardWatcher(reader, onNewContent, 10_000);

    watcher.pollOnce();
    watcher.stop();
    watcher.pollOnce();

    expect(onNewContent).toHaveBeenCalledTimes(2);
  });

  it("detects a new image exactly once", () => {
    const reader = fakeReader();
    const onNewContent = vi.fn();
    const watcher = new ClipboardWatcher(reader, onNewContent);
    const data = Buffer.from([1, 2, 3]);

    reader.setImage(img(data));
    watcher.pollOnce();
    watcher.pollOnce();

    expect(onNewContent).toHaveBeenCalledTimes(1);
    expect(onNewContent).toHaveBeenCalledWith({ type: "image", width: 1, height: 1, bitmap: data });
  });

  it("ignores repeated identical image content across polls", () => {
    const reader = fakeReader();
    reader.setImage(img(Buffer.from([1, 2, 3])));
    const onNewContent = vi.fn();
    const watcher = new ClipboardWatcher(reader, onNewContent);

    watcher.pollOnce();
    watcher.pollOnce();

    expect(onNewContent).toHaveBeenCalledTimes(1);
  });

  it("distinguishes two different images at the same dimensions", () => {
    const reader = fakeReader();
    reader.setImage(img(Buffer.from([1, 2, 3]), 10, 10));
    const onNewContent = vi.fn();
    const watcher = new ClipboardWatcher(reader, onNewContent);

    watcher.pollOnce();
    reader.setImage(img(Buffer.from([4, 5, 6]), 10, 10));
    watcher.pollOnce();

    expect(onNewContent).toHaveBeenCalledTimes(2);
    expect(onNewContent).toHaveBeenNthCalledWith(1, {
      type: "image",
      width: 10,
      height: 10,
      bitmap: Buffer.from([1, 2, 3]),
    });
    expect(onNewContent).toHaveBeenNthCalledWith(2, {
      type: "image",
      width: 10,
      height: 10,
      bitmap: Buffer.from([4, 5, 6]),
    });
  });

  it("treats a dimension change as new content without needing matching bitmaps", () => {
    const reader = fakeReader();
    reader.setImage(img(Buffer.from([1, 2, 3]), 10, 10));
    const onNewContent = vi.fn();
    const watcher = new ClipboardWatcher(reader, onNewContent);

    watcher.pollOnce();
    reader.setImage(img(Buffer.from([1, 2, 3]), 20, 20));
    watcher.pollOnce();

    expect(onNewContent).toHaveBeenCalledTimes(2);
    expect(onNewContent).toHaveBeenNthCalledWith(2, {
      type: "image",
      width: 20,
      height: 20,
      bitmap: Buffer.from([1, 2, 3]),
    });
  });

  it("emits only the image when both new image and new text are present in the same tick", () => {
    const reader = fakeReader("some text");
    reader.setImage(img(Buffer.from([1, 2, 3])));
    const onNewContent = vi.fn();
    const watcher = new ClipboardWatcher(reader, onNewContent);

    watcher.pollOnce();

    expect(onNewContent).toHaveBeenCalledTimes(1);
    expect(onNewContent).toHaveBeenCalledWith({ type: "image", width: 1, height: 1, bitmap: Buffer.from([1, 2, 3]) });
  });

  it("detects text again after switching away from an image back to previously-seen text", () => {
    const reader = fakeReader("original text");
    const onNewContent = vi.fn();
    const watcher = new ClipboardWatcher(reader, onNewContent);

    watcher.pollOnce(); // detects "original text"
    reader.setImage(img(Buffer.from([1, 2, 3])));
    watcher.pollOnce(); // detects the image
    reader.setImage(null); // clipboard now back to the same text as before

    watcher.pollOnce();

    const calls = onNewContent.mock.calls.map((call) => call[0] as ClipboardContent);
    expect(calls).toEqual([
      { type: "text", text: "original text" },
      { type: "image", width: 1, height: 1, bitmap: Buffer.from([1, 2, 3]) },
      { type: "text", text: "original text" },
    ]);
  });

  it("start() primes dedupe so an already-present image isn't immediately re-inserted", () => {
    const reader = fakeReader();
    reader.setImage(img(Buffer.from([1, 2, 3])));
    const onNewContent = vi.fn();
    const watcher = new ClipboardWatcher(reader, onNewContent, 10_000);

    watcher.start();
    watcher.pollOnce();
    watcher.stop();

    expect(onNewContent).not.toHaveBeenCalled();
  });
});
