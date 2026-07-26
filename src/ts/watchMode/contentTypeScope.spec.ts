import { describe, expect, it } from "vitest";
import { shouldInsertText } from "./contentTypeScope";

describe("shouldInsertText", () => {
  it("allows text insertion for scope 'text'", () => {
    expect(shouldInsertText("text")).toBe(true);
  });

  it("allows text insertion for scope 'both'", () => {
    expect(shouldInsertText("both")).toBe(true);
  });

  it("blocks text insertion for scope 'image'", () => {
    expect(shouldInsertText("image")).toBe(false);
  });
});
