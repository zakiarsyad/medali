/**
 * The columns of a student file, in the order of the template. `others`
 * are the titles a file may use instead. A new column goes last, so that
 * a file with no title row, made from an earlier template, is still read
 * in the right order.
 */
export const FILE_COLUMNS = [
  { title: "nim", others: [] },
  { title: "nama", others: [] },
  { title: "prodi", others: ["program studi", "program_studi"] },
  { title: "jalur", others: [] },
  { title: "jenis_kelamin", others: ["jk", "jenis kelamin"] },
  { title: "angkatan", others: [] },
  { title: "kelas", others: [] },
  { title: "provinsi", others: [] },
  { title: "instansi_asal", others: ["instansi", "instansi asal"] },
  { title: "afirmasi", others: [] },
  { title: "pembibitan", others: [] },
  { title: "internasional", others: [] },
  { title: "status", others: [] },
  { title: "email", others: [] },
] as const satisfies readonly { title: string; others: readonly string[] }[];

export type FileColumn = (typeof FILE_COLUMNS)[number]["title"];

/** The columns a file may leave out altogether: their cells are then empty. */
export const OPTIONAL_COLUMNS: readonly FileColumn[] = ["email"];

/** One row of a student file: the text under each column. */
export type FileCells = Record<FileColumn, string>;

export const TEMPLATE_FILE_NAME = "templat-mahasiswa-baru.csv";

/**
 * A made-up student that shows how a row is filled. It has no address:
 * any made-up one would be refused where the campus ending is set.
 */
const TEMPLATE_EXAMPLE: FileCells = {
  nim: "4121260001",
  nama: "Nama Mahasiswa",
  prodi: "Manajemen Keuangan Negara STR",
  jalur: "Reguler",
  jenis_kelamin: "P",
  angkatan: "2026",
  kelas: "1-01",
  provinsi: "Jawa Barat",
  instansi_asal: "",
  afirmasi: "tidak",
  pembibitan: "tidak",
  internasional: "tidak",
  status: "Aktif",
  email: "",
};

export function templateCsv(): string {
  const titles = FILE_COLUMNS.map((column) => column.title);
  const example = titles.map((title) => TEMPLATE_EXAMPLE[title]);
  return `${titles.join(",")}\n${example.join(",")}\n`;
}

/** The Angkatan choices as the notes and the reasons say them. */
export function yearRange(cohortYears: number[]): string {
  const sorted = [...cohortYears].sort((a, b) => a - b);
  return `${sorted[0]} sampai ${sorted.at(-1)}`;
}
