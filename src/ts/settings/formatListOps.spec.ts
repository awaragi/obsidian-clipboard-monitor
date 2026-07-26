import { describe, expect, it } from "vitest";
import { addFormat, deleteFormat, moveFormat, resetToDefaults, updateFormat } from "./formatListOps";
import type { TextFormat } from "../watchMode/textFormat";

function formats(...names: string[]): TextFormat[] {
  return names.map((name, i) => ({ id: `id-${i}`, name, template: `${name}: {{content}}` }));
}

describe("addFormat", () => {
  it("appends a new format with a generated id", () => {
    const before = formats("Raw");
    const after = addFormat(before, "TODO", "TODO: {{content}}");

    expect(after).toHaveLength(2);
    expect(after[1]).toMatchObject({ name: "TODO", template: "TODO: {{content}}" });
    expect(after[1].id).not.toBe(before[0].id);
    expect(before).toHaveLength(1); // input untouched
  });
});

describe("updateFormat", () => {
  it("changes only the targeted format", () => {
    const before = formats("Raw", "Bullet");
    const after = updateFormat(before, "id-1", { name: "Renamed" });

    expect(after[0]).toEqual(before[0]);
    expect(after[1]).toEqual({ ...before[1], name: "Renamed" });
  });

  it("is a no-op when the id doesn't match any format", () => {
    const before = formats("Raw");
    expect(updateFormat(before, "missing", { name: "X" })).toEqual(before);
  });
});

describe("deleteFormat", () => {
  it("removes the targeted format", () => {
    const before = formats("Raw", "Bullet");
    expect(deleteFormat(before, "id-0")).toEqual([before[1]]);
  });

  it("is a no-op when exactly one format remains", () => {
    const before = formats("Raw");
    expect(deleteFormat(before, "id-0")).toBe(before);
  });
});

describe("moveFormat", () => {
  it("moves an entry up, swapping with its predecessor", () => {
    const before = formats("Raw", "Bullet", "Callout");
    const after = moveFormat(before, "id-1", "up");
    expect(after.map((f) => f.name)).toEqual(["Bullet", "Raw", "Callout"]);
  });

  it("moves an entry down, swapping with its successor", () => {
    const before = formats("Raw", "Bullet", "Callout");
    const after = moveFormat(before, "id-1", "down");
    expect(after.map((f) => f.name)).toEqual(["Raw", "Callout", "Bullet"]);
  });

  it("is a no-op moving the first entry up", () => {
    const before = formats("Raw", "Bullet");
    expect(moveFormat(before, "id-0", "up")).toBe(before);
  });

  it("is a no-op moving the last entry down", () => {
    const before = formats("Raw", "Bullet");
    expect(moveFormat(before, "id-1", "down")).toBe(before);
  });
});

describe("resetToDefaults", () => {
  it("returns exactly the four shipped defaults", () => {
    expect(resetToDefaults().map((f) => f.name)).toEqual(["Raw", "Bullet", "Timestamped", "Callout"]);
  });
});
