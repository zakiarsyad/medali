import type { Parsed } from "@/parsed";

const BYTE_ORDER_MARK = "\uFEFF";
const QUOTE = '"';
const LINE_BREAK = /\r\n|\n|\r/;
const ONLY_SPACES = /^ *$/;

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

function unclosedQuote(row: number): { ok: false; error: string } {
  const shown = row.toLocaleString("id-ID");
  return {
    ok: false,
    error: `Tanda kutip di baris ${shown} tidak ditutup. Perbaiki berkas, lalu unggah lagi.`,
  };
}

/**
 * Reads CSV text into rows of cells, every row of the file in its place,
 * the empty ones too, so that a row keeps the number it has in the file.
 *
 * A cell is quoted when a quote is the first thing in it, after spaces at
 * most. It may then hold the separator, a line break, and a quote written
 * twice. A quote after anything else is an ordinary character. A quoted
 * cell that is never closed would take in the rest of the file, so the
 * text is refused, with the row where that quote is.
 */
export function readCsv(text: string): Parsed<string[][]> {
  const content = text.startsWith(BYTE_ORDER_MARK) ? text.slice(1) : text;
  const separator = separatorOf(content);
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  let wasQuoted = false;
  let quoteRow = 0;

  for (let at = 0; at < content.length; at++) {
    const char = content.charAt(at);
    const next = content.charAt(at + 1);
    if (quoted && char === QUOTE && next === QUOTE) {
      cell += QUOTE;
      at++;
    } else if (quoted && char === QUOTE) {
      quoted = false;
    } else if (quoted) {
      cell += char;
    } else if (char === QUOTE && !wasQuoted && ONLY_SPACES.test(cell)) {
      cell = "";
      quoted = true;
      wasQuoted = true;
      quoteRow = rows.length + 1;
    } else if (char === separator) {
      row.push(cell);
      cell = "";
      wasQuoted = false;
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && next === "\n") at++;
      rows.push([...row, cell]);
      row = [];
      cell = "";
      wasQuoted = false;
    } else {
      cell += char;
    }
  }
  if (quoted) return unclosedQuote(quoteRow);
  if (cell !== "" || row.length > 0) rows.push([...row, cell]);
  return { ok: true, value: rows };
}
