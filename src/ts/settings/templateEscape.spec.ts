import { describe, expect, it } from "vitest";
import { escapeTemplateForInput, unescapeTemplateFromInput } from "./templateEscape";

describe("escapeTemplateForInput", () => {
  it("converts newlines to literal \\n", () => {
    expect(escapeTemplateForInput("\n- {{content}}")).toBe("\\n- {{content}}");
  });

  it("converts multiple newlines", () => {
    expect(escapeTemplateForInput("> [!note]\n> {{content}}")).toBe("> [!note]\\n> {{content}}");
  });

  it("normalizes CRLF to a single literal \\n", () => {
    expect(escapeTemplateForInput("a\r\nb")).toBe("a\\nb");
  });

  it("leaves single-line templates unchanged", () => {
    expect(escapeTemplateForInput("{{content}}")).toBe("{{content}}");
  });
});

describe("unescapeTemplateFromInput", () => {
  it("converts literal \\n to a real newline", () => {
    expect(unescapeTemplateFromInput("\\n- {{content}}")).toBe("\n- {{content}}");
  });

  it("converts multiple literal \\n occurrences", () => {
    expect(unescapeTemplateFromInput("> [!note]\\n> {{content}}")).toBe("> [!note]\n> {{content}}");
  });

  it("leaves input without literal \\n unchanged", () => {
    expect(unescapeTemplateFromInput("{{content}}")).toBe("{{content}}");
  });
});

describe("round trip", () => {
  it("escape then unescape returns the original template", () => {
    const template = "\n> [!note]\n> {{content}} at {{time}}";
    expect(unescapeTemplateFromInput(escapeTemplateForInput(template))).toBe(template);
  });
});
