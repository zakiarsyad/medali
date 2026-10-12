const COLUMN_TITLE = /<th>([^<>{}]+)<\/th>/g;

/**
 * Lists the column titles of a list that its rows do not carry. A stacked
 * list hides its header on a phone and shows each value beside the title
 * in its cell's `data-title`, so a column without one would lose its title
 * there. A header cell that holds more than plain words, such as the
 * hidden title above the buttons of a row, is not a column of values.
 */
export function findMissingStackedTitles(code: string): string[] {
  const missing: string[] = [];
  for (const [, title = ""] of code.matchAll(COLUMN_TITLE)) {
    const name = title.trim();
    if (!code.includes(`data-title="${name}"`)) missing.push(name);
  }
  return missing;
}
