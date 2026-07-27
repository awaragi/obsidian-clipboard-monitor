import { t, type TranslationKey } from "../i18n/i18n";

export interface TextFormat {
  id: string;
  name: string;
  template: string;
}

const DEFAULT_TEXT_FORMAT_DEFS: { nameKey: TranslationKey; template: string }[] = [
  { nameKey: "format.default.raw", template: "\n{{content}}" },
  { nameKey: "format.default.bullet", template: "\n- {{content}}" },
  { nameKey: "format.default.timestamped", template: "\n**{{time}}** — {{content}}" },
  { nameKey: "format.default.callout", template: "\n> [!note]\n> {{content}}" },
];

/** The four formats the plugin ships with, fixed for reference (e.g. display in docs/tests). Named per the active system locale. */
export const DEFAULT_TEXT_FORMATS: TextFormat[] = DEFAULT_TEXT_FORMAT_DEFS.map((def) => ({
  id: crypto.randomUUID(),
  name: t(def.nameKey),
  template: def.template,
}));

/** Returns a fresh copy of the shipped default formats, each with a newly generated id and a name in the active system locale — used for first-install seeding and "Reset to defaults" so neither reuses a stale id or a stale locale's name. */
export function createDefaultTextFormats(): TextFormat[] {
  return DEFAULT_TEXT_FORMAT_DEFS.map((def) => ({
    id: crypto.randomUUID(),
    name: t(def.nameKey),
    template: def.template,
  }));
}

function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

/** Substitutes `{{content}}` with `content` and `{{time}}` with `now` formatted as 24-hour HH:MM. */
export function renderFormat(template: string, content: string, now: Date = new Date()): string {
  const time = `${pad2(now.getHours())}:${pad2(now.getMinutes())}`;
  return template.replaceAll("{{content}}", content).replaceAll("{{time}}", time);
}

/** Returns `lastUsedFormatId` if it still matches a format in the list, else falls back to the first format's id. `formats` must be non-empty. */
export function resolveLastUsedFormatId(formats: TextFormat[], lastUsedFormatId: string | undefined): string {
  if (lastUsedFormatId && formats.some((format) => format.id === lastUsedFormatId)) {
    return lastUsedFormatId;
  }
  return formats[0].id;
}
