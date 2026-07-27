import { describe, it, expect } from "vitest";
import { translate, isRtl, locales } from "./i18n";

const en = locales["en"];

describe("translate", () => {
  it("returns the English string for the en locale", () => {
    expect(translate("common.cancel", "en")).toBe("Cancel");
  });

  it("returns a different string for the fr locale", () => {
    expect(translate("common.cancel", "fr")).toBe("Annuler");
  });

  it("falls back to English for an unknown locale", () => {
    expect(translate("common.cancel", "xx")).toBe("Cancel");
  });

  it("interpolates {{var}} placeholders", () => {
    expect(translate("settings.formats.delete_confirm_message", "en", { name: "Bullet" })).toBe(
      'Delete "Bullet"? This can\'t be undone.'
    );
  });
});

describe("locale completeness", () => {
  const requiredKeys = Object.keys(en);

  for (const [code, translations] of Object.entries(locales)) {
    if (code === "en") continue;

    describe(`${code} locale`, () => {
      for (const key of requiredKeys) {
        it(`has a non-empty translation for "${key}"`, () => {
          const value = (translations as Record<string, string | undefined>)[key];
          expect(typeof value).toBe("string");
          expect((value as string).length).toBeGreaterThan(0);
        });
      }
    });
  }
});

describe("isRtl", () => {
  it("returns true for Arabic", () => {
    expect(isRtl("ar")).toBe(true);
  });

  it("returns false for English, French, and Spanish", () => {
    expect(isRtl("en")).toBe(false);
    expect(isRtl("fr")).toBe(false);
    expect(isRtl("es")).toBe(false);
  });
});
