export interface ParsedVerse {
  text: string;
  reference: string | null;
}

const REF_RE = /\s*\[([^\]]+)\]\s*$/;

/**
 * Parse a multi-line paste into verse records. One verse per non-empty line.
 * An optional `[reference]` suffix is split out, e.g.
 *   "Be still, and know that I am God. [Psalm 46:10]"
 *     -> { text: "Be still, and know that I am God.", reference: "Psalm 46:10" }
 */
export function parseVerseLines(input: string): ParsedVerse[] {
  return input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      const match = line.match(REF_RE);
      if (match && match.index !== undefined) {
        return {
          text: line.slice(0, match.index).trim(),
          reference: match[1]?.trim() || null,
        };
      }
      return { text: line, reference: null };
    })
    .filter((v) => v.text.length > 0);
}
