/*
 * The columns of a SIKU file and its template. Read by the screen parts
 * in the browser, so nothing here may take from the database code.
 */

/** The columns of a SIKU file, in the order of the template. */
export const SIKU_FILE_COLUMNS = [
  { title: "nim", others: [] },
  { title: "jenis", others: [] },
  { title: "alasan", others: [] },
  { title: "poin", others: [] },
  { title: "keterangan", others: [] },
] as const satisfies readonly { title: string; others: readonly string[] }[];

export type SikuFileColumn = (typeof SIKU_FILE_COLUMNS)[number]["title"];

/** The columns a file may leave out altogether: their cells are then empty. */
export const SIKU_OPTIONAL_COLUMNS: readonly SikuFileColumn[] = ["keterangan"];

export const SIKU_TEMPLATE_FILE_NAME = "templat-penyesuaian-siku.csv";

/** What the columns take, in the prototype's words. */
export const SIKU_FILE_NOTE =
  "Jenis: tambah atau kurang. Alasan boleh nomor urut (penambahan 1–5, pengurangan 1–4) atau teks alasannya. Poin 1–30.";

/** A made-up gain that shows how a row is filled. */
const TEMPLATE_EXAMPLE: Record<SikuFileColumn, string> = {
  nim: "4121239999",
  jenis: "tambah",
  alasan: "5",
  poin: "2",
  keterangan: "Petugas kegiatan ibadah rutin",
};

export function sikuTemplateCsv(): string {
  const titles = SIKU_FILE_COLUMNS.map((column) => column.title);
  const example = titles.map((title) => TEMPLATE_EXAMPLE[title]);
  return `${titles.join(",")}\n${example.join(",")}\n`;
}
