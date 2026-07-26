import { describe, expect, it } from "vitest";
import { shouldInsertImage, shouldInsertText } from "./contentTypeScope";

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

describe("shouldInsertImage", () => {
  it("allows image insertion for scope 'image'", () => {
    expect(shouldInsertImage("image")).toBe(true);
  });

  it("allows image insertion for scope 'both'", () => {
    expect(shouldInsertImage("both")).toBe(true);
  });

  it("blocks image insertion for scope 'text'", () => {
    expect(shouldInsertImage("text")).toBe(false);
  });
});
