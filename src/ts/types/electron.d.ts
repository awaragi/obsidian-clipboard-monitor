declare module "electron" {
  export interface Clipboard {
    readText(): string;
  }

  export const clipboard: Clipboard;
}
