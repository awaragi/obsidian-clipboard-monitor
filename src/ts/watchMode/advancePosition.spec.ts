import { describe, expect, it } from "vitest";
import { advancePosition } from "./advancePosition";

describe("advancePosition", () => {
  it("advances ch on the same line for single-line text", () => {
    expect(advancePosition({ line: 3, ch: 5 }, "hello")).toEqual({ line: 3, ch: 10 });
  });

  it("returns the same position for empty text", () => {
    expect(advancePosition({ line: 3, ch: 5 }, "")).toEqual({ line: 3, ch: 5 });
  });

  it("moves to a new line and resets ch for multi-line text", () => {
    expect(advancePosition({ line: 2, ch: 4 }, "line one\nline two\nabc")).toEqual({
      line: 4,
      ch: 3,
    });
  });

  it("chains correctly: advancing twice lands after both insertions", () => {
    const afterFirst = advancePosition({ line: 0, ch: 0 }, "abc\ndef");
    const afterSecond = advancePosition(afterFirst, "ghi");
    expect(afterSecond).toEqual({ line: 1, ch: 6 });
  });
});
