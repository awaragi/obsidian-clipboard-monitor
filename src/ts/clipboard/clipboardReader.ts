import { clipboard, nativeImage } from "electron";
import type { Buffer } from "buffer";

export interface ClipboardImage {
  width: number;
  height: number;
  bitmap: Buffer;
}

export interface ClipboardReader {
  readText(): string;
  /** Reads image dimensions and raw pixel data — no PNG encode. */
  readImage(): ClipboardImage | null;
  /** Encodes a previously-read image to PNG, deferred until actually needed (e.g. saving an attachment). */
  encodeImageToPng(image: ClipboardImage): Buffer;
  /** Clears the entire system clipboard, all formats. */
  clear(): void;
}

export class ElectronClipboardReader implements ClipboardReader {
  readText(): string {
    return clipboard.readText();
  }

  readImage(): ClipboardImage | null {
    const image = clipboard.readImage();
    if (image.isEmpty()) return null;
    const { width, height } = image.getSize();
    return { width, height, bitmap: image.toBitmap() };
  }

  encodeImageToPng(image: ClipboardImage): Buffer {
    return nativeImage.createFromBitmap(image.bitmap, { width: image.width, height: image.height }).toPNG();
  }

  clear(): void {
    clipboard.clear();
  }
}
