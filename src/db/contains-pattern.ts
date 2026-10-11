/**
 * The pattern that finds a text anywhere in a value. The signs `%`, `_`
 * and `\` in the text are searched for as written.
 */
export function containsPattern(text: string): string {
  return `%${text.replace(/[\\%_]/g, "\\$&")}%`;
}
