import { describe, expect, it } from "vitest";
import { hashBuffer, hashBufferFast, hashText } from "./hash";

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

describe("hashBuffer", () => {
  it("returns the same hash for identical input", () => {
    const data = Buffer.from([1, 2, 3]);
    expect(hashBuffer(data)).toBe(hashBuffer(Buffer.from([1, 2, 3])));
  });

  it("returns different hashes for different input", () => {
    expect(hashBuffer(Buffer.from([1, 2, 3]))).not.toBe(hashBuffer(Buffer.from([1, 2, 4])));
  });
});

describe("hashBufferFast", () => {
  it("returns the same hash for identical input", () => {
    const data = Buffer.from([1, 2, 3]);
    expect(hashBufferFast(data)).toBe(hashBufferFast(Buffer.from([1, 2, 3])));
  });

  it("returns different hashes for different input", () => {
    expect(hashBufferFast(Buffer.from([1, 2, 3]))).not.toBe(hashBufferFast(Buffer.from([1, 2, 4])));
  });

  it("hashes an empty buffer without throwing", () => {
    expect(() => hashBufferFast(Buffer.alloc(0))).not.toThrow();
  });
});
