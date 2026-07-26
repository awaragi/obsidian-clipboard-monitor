import type { EditorPositionLike } from "./types";

/** Computes the cursor position immediately after `text` was inserted at `start`. */
export function advancePosition(start: EditorPositionLike, text: string): EditorPositionLike {
  const lines = text.split("\n");

  if (lines.length === 1) {
    return { line: start.line, ch: start.ch + text.length };
  }

  return {
    line: start.line + lines.length - 1,
    ch: lines[lines.length - 1].length,
  };
}
