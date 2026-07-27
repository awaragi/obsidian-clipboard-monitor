import { createHash } from "crypto";

export function hashText(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

export function hashBuffer(data: Buffer): string {
  return createHash("sha256").update(data).digest("hex");
}

/**
 * Fast, non-cryptographic buffer hash for change detection (e.g. image
 * bitmaps hashed on every poll tick). No collision-resistance guarantee —
 * only appropriate where the goal is "did the bytes change," not defending
 * against a deliberate adversary.
 */
export function hashBufferFast(data: Buffer): string {
  return createHash("md5").update(data).digest("hex");
}
