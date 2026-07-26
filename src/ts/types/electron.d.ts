declare module "electron" {
  export interface NativeImage {
    isEmpty(): boolean;
    toPNG(): Buffer;
  }

  export interface Clipboard {
    readText(): string;
    readImage(): NativeImage;
  }

  export const clipboard: Clipboard;
}
