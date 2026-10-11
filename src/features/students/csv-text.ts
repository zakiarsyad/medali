const BYTE_ORDER_MARK = "\uFEFF";
const QUOTE = '"';

function count(text: string, mark: string): number {
  return text.split(mark).length - 1;
}

/** A spreadsheet set to Indonesian saves CSV with `;` between the columns. */
function separatorOf(content: string): string {
  const firstLine = content.split(/\r?\n/, 1)[0] ?? "";
  return count(firstLine, ";") > count(firstLine, ",") ? ";" : ",";
}

/**
 * Reads CSV text into rows of cells, every row of the file in its place,
 * the empty ones too, so that a row keeps the number it has in the file.
 * A cell in quotes may hold the separator, a line break, and a quote
 * written twice.
 */
export function readCsv(text: string): string[][] {
  const content = text.startsWith(BYTE_ORDER_MARK) ? text.slice(1) : text;
  const separator = separatorOf(content);
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let at = 0; at < content.length; at++) {
    const char = content.charAt(at);
    const next = content.charAt(at + 1);
    if (quoted && char === QUOTE && next === QUOTE) {
      cell += QUOTE;
      at++;
    } else if (char === QUOTE) {
      quoted = !quoted;
    } else if (quoted) {
      cell += char;
    } else if (char === separator) {
      row.push(cell);
      cell = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && next === "\n") at++;
      rows.push([...row, cell]);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  if (cell !== "" || row.length > 0) rows.push([...row, cell]);
  return rows;
}
