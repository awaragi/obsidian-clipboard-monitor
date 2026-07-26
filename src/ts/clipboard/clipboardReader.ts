import { clipboard } from "electron";

export interface ClipboardReader {
  readText(): string;
}

export class ElectronClipboardReader implements ClipboardReader {
  readText(): string {
    return clipboard.readText();
  }
}
