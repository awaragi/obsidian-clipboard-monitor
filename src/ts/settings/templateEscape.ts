/** The template field is edited as a single-line text input, so real newlines are represented as the literal two-character sequence `\n`. These convert between that display form and the real newline characters stored in `TextFormat.template`. */

export function escapeTemplateForInput(template: string): string {
  return template.replace(/\r\n|\n/g, "\\n");
}

export function unescapeTemplateFromInput(input: string): string {
  return input.replace(/\\n/g, "\n");
}
