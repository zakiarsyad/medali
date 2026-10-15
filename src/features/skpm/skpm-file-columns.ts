/*
 * The columns of an SKPM file and its template. Read by the screen parts
 * in the browser, so nothing here may take from the database code.
 */

/** The columns of an SKPM file, in the order of the template. */
export const SKPM_FILE_COLUMNS = [
  { title: "nim", others: [] },
  { title: "kegiatan", others: ["nama_kegiatan"] },
  { title: "kategori", others: [] },
  { title: "tingkat", others: [] },
  { title: "peran", others: [] },
  { title: "tanggal", others: [] },
  { title: "poin", others: ["skor", "kredit"] },
] as const satisfies readonly { title: string; others: readonly string[] }[];

export type SkpmFileColumn = (typeof SKPM_FILE_COLUMNS)[number]["title"];

export const SKPM_TEMPLATE_FILE_NAME = "templat-skpm.csv";

/** What the cells take, in the prototype's words. */
export const SKPM_FILE_NOTE = "Kolom tingkat, peran, dan tanggal boleh kosong.";

/** A made-up activity that shows how a row is filled. */
const TEMPLATE_EXAMPLE: Record<SkpmFileColumn, string> = {
  nim: "4121239999",
  kegiatan: "Lomba debat anggaran",
  kategori: "Lomba atau kompetisi",
  tingkat: "Nasional",
  peran: "Peserta",
  tanggal: "2025-10-12",
  poin: "8",
};

export function skpmTemplateCsv(): string {
  const titles = SKPM_FILE_COLUMNS.map((column) => column.title);
  const example = titles.map((title) => TEMPLATE_EXAMPLE[title]);
  return `${titles.join(",")}\n${example.join(",")}\n`;
}
