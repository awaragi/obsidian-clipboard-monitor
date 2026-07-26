import { createHash } from "crypto";

export function hashText(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

export function hashBuffer(data: Buffer): string {
  return createHash("sha256").update(data).digest("hex");
}
