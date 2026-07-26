import { clipboard } from "electron";

export interface ClipboardReader {
  readText(): string;
  readImage(): Buffer | null;
}

export class ElectronClipboardReader implements ClipboardReader {
  readText(): string {
    return clipboard.readText();
  }

  readImage(): Buffer | null {
    const image = clipboard.readImage();
    return image.isEmpty() ? null : image.toPNG();
  }
}
