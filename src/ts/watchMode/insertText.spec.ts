import { describe, expect, it } from "vitest";
import { insertText } from "./insertText";
import type { EditorLike, EditorPositionLike } from "./types";

function fakeEditor(cursor: EditorPositionLike) {
  const calls: { text: string; from: EditorPositionLike; to: EditorPositionLike }[] = [];
  let currentCursor = cursor;

  const editor: EditorLike = {
    getCursor: () => currentCursor,
    replaceRange: (text, from, to) => {
      calls.push({ text, from, to });
    },
    setCursor: (pos) => {
      currentCursor = pos;
    },
  };

  return { editor, calls, getCursor: () => currentCursor };
}

describe("insertText", () => {
  it("inserts at the current cursor position", () => {
    const { editor, calls } = fakeEditor({ line: 1, ch: 2 });

    insertText(editor, "hi");

    expect(calls).toEqual([{ text: "hi", from: { line: 1, ch: 2 }, to: { line: 1, ch: 2 } }]);
  });

  it("moves the cursor past the inserted text", () => {
    const { editor, getCursor } = fakeEditor({ line: 0, ch: 0 });

    insertText(editor, "hello");

    expect(getCursor()).toEqual({ line: 0, ch: 5 });
  });

  it("chains consecutive insertions instead of overwriting", () => {
    const { editor, calls } = fakeEditor({ line: 0, ch: 0 });

    insertText(editor, "first");
    insertText(editor, "second");

    expect(calls).toEqual([
      { text: "first", from: { line: 0, ch: 0 }, to: { line: 0, ch: 0 } },
      { text: "second", from: { line: 0, ch: 5 }, to: { line: 0, ch: 5 } },
    ]);
  });
});
