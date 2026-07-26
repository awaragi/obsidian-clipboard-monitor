export type ContentTypeScope = "text" | "image" | "both";

export const DEFAULT_CONTENT_TYPE_SCOPE: ContentTypeScope = "both";

export const CONTENT_TYPE_SCOPE_OPTIONS: { value: ContentTypeScope; label: string }[] = [
  { value: "text", label: "Text only" },
  { value: "image", label: "Images only" },
  { value: "both", label: "Both" },
];

/** Whether newly detected clipboard text should be inserted under the given scope. */
export function shouldInsertText(scope: ContentTypeScope): boolean {
  return scope !== "image";
}
