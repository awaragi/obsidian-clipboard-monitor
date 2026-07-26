function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

/** Filename for a clipboard-image attachment, matching Obsidian's own manual-paste convention. */
export function generateAttachmentFilename(now: Date = new Date()): string {
  const stamp =
    `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}` +
    `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  return `Pasted image ${stamp}.png`;
}
