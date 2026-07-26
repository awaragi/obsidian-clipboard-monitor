import { describe, expect, it } from "vitest";
import { generateAttachmentFilename } from "./attachmentFilename";

describe("generateAttachmentFilename", () => {
  it("formats the injected timestamp as Pasted image <YYYYMMDDHHmmss>.png", () => {
    const now = new Date(2026, 6, 26, 14, 5, 9);
    expect(generateAttachmentFilename(now)).toBe("Pasted image 20260726140509.png");
  });

  it("zero-pads single-digit month, day, hour, minute, and second", () => {
    const now = new Date(2026, 0, 3, 4, 5, 6);
    expect(generateAttachmentFilename(now)).toBe("Pasted image 20260103040506.png");
  });
});
