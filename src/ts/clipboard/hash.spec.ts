import { describe, expect, it } from "vitest";
import { hashText } from "./hash";

describe("hashText", () => {
  it("returns the same hash for identical input", () => {
    expect(hashText("hello")).toBe(hashText("hello"));
  });

  it("returns different hashes for different input", () => {
    expect(hashText("hello")).not.toBe(hashText("hello world"));
  });

  it("hashes empty string without throwing", () => {
    expect(() => hashText("")).not.toThrow();
  });
});
