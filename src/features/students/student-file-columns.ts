/** The most student rows one file may hold, and its largest size. */
export const MAX_FILE_ROWS = 1000;
export const MAX_FILE_BYTES = 1024 * 1024;

/**
 * The columns of a student file, in the order of the template. `others`
 * are the titles a file may use instead.
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
] as const satisfies readonly { title: string; others: readonly string[] }[];

export type FileColumn = (typeof FILE_COLUMNS)[number]["title"];

/** One row of a student file: the text under each column. */
export type FileCells = Record<FileColumn, string>;

export const TEMPLATE_FILE_NAME = "templat-mahasiswa-baru.csv";

/** A made-up student that shows how a row is filled. */
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
};

export function templateCsv(): string {
  const titles = FILE_COLUMNS.map((column) => column.title);
  const example = titles.map((title) => TEMPLATE_EXAMPLE[title]);
  return `${titles.join(",")}\n${example.join(",")}\n`;
}
