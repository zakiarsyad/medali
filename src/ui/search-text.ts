/** The most letters the search field takes. The server refuses more. */
export const SEARCH_TEXT_MAX = 100;

/**
 * The text to search students by, or null when there is nothing to search
 * for: an empty text, or one longer than the search field lets through,
 * which only a hand-made request sends. The null character is dropped:
 * the database refuses a query that holds it, and fails the whole screen.
 */
export function searchText(typed: string): string | null {
  const sent = typed.replaceAll("\0", "");
  if (sent.length > SEARCH_TEXT_MAX) return null;
  const text = sent.trim();
  if (text === "") return null;
  return text;
}
