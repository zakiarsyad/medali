const BYTE_ORDER_MARK = "﻿";
const QUOTE = '"';
const LINE_BREAK = /\r\n|\n|\r/;

/** How many times a mark is in a line, leaving out what is inside quotes. */
function countOutsideQuotes(line: string, mark: string): number {
  let found = 0;
  let quoted = false;
  for (const char of line) {
    if (char === QUOTE) quoted = !quoted;
    else if (char === mark && !quoted) found++;
  }
  return found;
}

/** A spreadsheet set to Indonesian saves CSV with `;` between the columns. */
function separatorOf(content: string): string {
  const lines = content.split(LINE_BREAK);
  const firstLine = lines.find((line) => line.trim() !== "") ?? "";
  const semicolons = countOutsideQuotes(firstLine, ";");
  return semicolons > countOutsideQuotes(firstLine, ",") ? ";" : ",";
}

/**
 * Reads CSV text into rows of cells, every row of the file in its place,
 * the empty ones too, so that a row keeps the number it has in the file.
 * A cell that starts with a quote may hold the separator, a line break,
 * and a quote written twice. A quote anywhere else in a cell is an
 * ordinary character, so one stray quote cannot swallow the rows after it.
 */
export function readCsv(text: string): string[][] {
  const content = text.startsWith(BYTE_ORDER_MARK) ? text.slice(1) : text;
  const separator = separatorOf(content);
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  let cellStarts = true;

  for (let at = 0; at < content.length; at++) {
    const char = content.charAt(at);
    const next = content.charAt(at + 1);
    const first = cellStarts;
    cellStarts = false;
    if (quoted && char === QUOTE && next === QUOTE) {
      cell += QUOTE;
      at++;
    } else if (quoted && char === QUOTE) {
      quoted = false;
    } else if (quoted) {
      cell += char;
    } else if (char === QUOTE && first) {
      quoted = true;
    } else if (char === separator) {
      row.push(cell);
      cell = "";
      cellStarts = true;
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && next === "\n") at++;
      rows.push([...row, cell]);
      row = [];
      cell = "";
      cellStarts = true;
    } else {
      cell += char;
    }
  }
  if (cell !== "" || row.length > 0) rows.push([...row, cell]);
  return rows;
}
