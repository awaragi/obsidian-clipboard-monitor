import type { TranslationKey } from "../i18n/i18n";

export type ContentTypeScope = "text" | "image" | "both";

export const DEFAULT_CONTENT_TYPE_SCOPE: ContentTypeScope = "both";

export const CONTENT_TYPE_SCOPE_OPTIONS: { value: ContentTypeScope; labelKey: TranslationKey }[] = [
  { value: "text", labelKey: "content_type.text_only" },
  { value: "image", labelKey: "content_type.images_only" },
  { value: "both", labelKey: "content_type.both" },
];

/** Whether newly detected clipboard text should be inserted under the given scope. */
export function shouldInsertText(scope: ContentTypeScope): boolean {
  return scope !== "image";
}

/** Whether newly detected clipboard image content should be inserted under the given scope. */
export function shouldInsertImage(scope: ContentTypeScope): boolean {
  return scope !== "text";
}
