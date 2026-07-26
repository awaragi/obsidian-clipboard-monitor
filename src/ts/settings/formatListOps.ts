import { createDefaultTextFormats, type TextFormat } from "../watchMode/textFormat";

/** Pure, DOM-free operations on a managed TextFormat list — kept separate from the settings tab's rendering so list logic is unit-testable without Obsidian's UI APIs. Every function returns a new array; none mutate their input. */

export function addFormat(formats: TextFormat[], name: string, template: string): TextFormat[] {
  return [...formats, { id: crypto.randomUUID(), name, template }];
}

export function updateFormat(
  formats: TextFormat[],
  id: string,
  changes: Partial<Pick<TextFormat, "name" | "template">>
): TextFormat[] {
  return formats.map((format) => (format.id === id ? { ...format, ...changes } : format));
}

/** No-op (returns `formats` unchanged) when only one format remains — the list must never go empty. */
export function deleteFormat(formats: TextFormat[], id: string): TextFormat[] {
  if (formats.length <= 1) return formats;
  return formats.filter((format) => format.id !== id);
}

/** No-op at the respective boundary (moving the first entry up, or the last entry down). */
export function moveFormat(formats: TextFormat[], id: string, direction: "up" | "down"): TextFormat[] {
  const index = formats.findIndex((format) => format.id === id);
  if (index === -1) return formats;

  const targetIndex = direction === "up" ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= formats.length) return formats;

  const next = [...formats];
  [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
  return next;
}

export function resetToDefaults(): TextFormat[] {
  return createDefaultTextFormats();
}
