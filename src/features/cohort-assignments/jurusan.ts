/**
 * The jurusan a program studi belongs to, worked out from its name as the
 * prototype does. The order matters: a name is tried for each jurusan in
 * turn, and one that fits none is of Jurusan Manajemen Keuangan.
 */
export function jurusanOf(programName: string): string {
  if (/Pajak|PBB/.test(programName)) return "Jurusan Pajak";
  if (programName.includes("Akuntansi")) return "Jurusan Akuntansi";
  if (programName.includes("Kepabeanan")) return "Jurusan Kepabeanan dan Cukai";
  return "Jurusan Manajemen Keuangan";
}

/**
 * Whether a mentor is of the jurusan of a program studi: the unit of
 * their account is that jurusan.
 */
export function isOfJurusan(unit: string | null, programName: string): boolean {
  return unit === jurusanOf(programName);
}
