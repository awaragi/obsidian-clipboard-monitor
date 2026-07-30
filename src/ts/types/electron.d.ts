declare module "electron" {
  export interface NativeImage {
    isEmpty(): boolean;
    toPNG(): Uint8Array;
    toBitmap(): Uint8Array;
    getSize(): { width: number; height: number };
  }

  export interface Clipboard {
    readText(): string;
    readImage(): NativeImage;
    clear(): void;
  }

  export interface NativeImageStatic {
    createFromBitmap(buffer: Uint8Array, options: { width: number; height: number }): NativeImage;
  }

  export const clipboard: Clipboard;
  export const nativeImage: NativeImageStatic;
}
