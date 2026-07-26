import { advancePosition } from "./advancePosition";
import type { EditorLike } from "./types";

/** Inserts `text` at the editor's current cursor and moves the cursor past it. */
export function insertText(editor: EditorLike, text: string): void {
  const cursor = editor.getCursor();
  editor.replaceRange(text, cursor, cursor);
  editor.setCursor(advancePosition(cursor, text));
}
