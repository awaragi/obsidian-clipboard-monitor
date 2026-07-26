import { describe, expect, it } from "vitest";
import { createDefaultTextFormats, renderFormat, resolveLastUsedFormatId } from "./textFormat";
import type { TextFormat } from "./textFormat";

describe("renderFormat", () => {
  it("substitutes {{content}}", () => {
    expect(renderFormat("- {{content}}", "pasted text")).toBe("- pasted text");
  });

  it("substitutes {{time}} using the injected clock, formatted as 24-hour HH:MM", () => {
    const now = new Date(2026, 0, 1, 14, 5);
    expect(renderFormat("**{{time}}** — {{content}}", "note", now)).toBe("**14:05** — note");
  });

  it("pads single-digit hours and minutes", () => {
    const now = new Date(2026, 0, 1, 9, 3);
    expect(renderFormat("{{time}}", "x", now)).toBe("09:03");
  });

  it("substitutes both tokens when a template uses each more than once", () => {
    const now = new Date(2026, 0, 1, 8, 0);
    expect(renderFormat("{{time}} {{content}} {{time}} {{content}}", "x", now)).toBe("08:00 x 08:00 x");
  });

  it("leaves output unchanged apart from omitting content when {{content}} is absent", () => {
    expect(renderFormat("static text", "ignored")).toBe("static text");
  });
});

describe("createDefaultTextFormats", () => {
  it("returns the four shipped defaults", () => {
    const formats = createDefaultTextFormats();
    expect(formats.map((f) => f.name)).toEqual(["Raw", "Bullet", "Timestamped", "Callout"]);
  });

  it("generates distinct ids across separate calls", () => {
    const first = createDefaultTextFormats();
    const second = createDefaultTextFormats();
    const firstIds = new Set(first.map((f) => f.id));
    for (const format of second) {
      expect(firstIds.has(format.id)).toBe(false);
    }
  });
});

describe("resolveLastUsedFormatId", () => {
  const formats: TextFormat[] = [
    { id: "a", name: "Raw", template: "{{content}}" },
    { id: "b", name: "Bullet", template: "- {{content}}" },
  ];

  it("returns the given id when it still matches a format", () => {
    expect(resolveLastUsedFormatId(formats, "b")).toBe("b");
  });

  it("falls back to the first format's id when undefined", () => {
    expect(resolveLastUsedFormatId(formats, undefined)).toBe("a");
  });

  it("falls back to the first format's id when the id no longer matches any format", () => {
    expect(resolveLastUsedFormatId(formats, "deleted-id")).toBe("a");
  });
});
