declare module "electron" {
  export interface NativeImage {
    isEmpty(): boolean;
    toPNG(): Buffer;
    toBitmap(): Buffer;
    getSize(): { width: number; height: number };
  }

  export interface Clipboard {
    readText(): string;
    readImage(): NativeImage;
    clear(): void;
  }

  export interface NativeImageStatic {
    createFromBitmap(buffer: Buffer, options: { width: number; height: number }): NativeImage;
  }

  export const clipboard: Clipboard;
  export const nativeImage: NativeImageStatic;
}
