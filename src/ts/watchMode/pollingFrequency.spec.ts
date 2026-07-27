import { describe, expect, it } from "vitest";
import { DEFAULT_POLLING_FREQUENCY, pollingFrequencyToMs } from "./pollingFrequency";

describe("pollingFrequencyToMs", () => {
  it("maps 'fast' to 500ms", () => {
    expect(pollingFrequencyToMs("fast")).toBe(500);
  });

  it("maps 'moderate' to 1000ms", () => {
    expect(pollingFrequencyToMs("moderate")).toBe(1000);
  });

  it("maps 'slow' to 2000ms", () => {
    expect(pollingFrequencyToMs("slow")).toBe(2000);
  });
});

describe("DEFAULT_POLLING_FREQUENCY", () => {
  it("defaults to 'moderate'", () => {
    expect(DEFAULT_POLLING_FREQUENCY).toBe("moderate");
  });
});
