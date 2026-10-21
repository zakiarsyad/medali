import type { ConsentPick } from "./consent-picks";

/*
 * What "Tindak lanjuti" of a referral and "Buka" of "Daftar mahasiswa"
 * do. Read by the screen parts in the browser, so nothing here may take
 * from the database code.
 */

/** A row of a list that names a student. */
export interface StudentRow {
  studentId: string;
  name: string;
  nim: string;
  program: string;
}

/** The student of a row, as "Persetujuan konseling" picks one. */
export function pickOf(row: StudentRow): ConsentPick {
  return {
    id: row.studentId,
    name: row.name,
    nim: row.nim,
    program: row.program,
  };
}

/**
 * "Tindak lanjuti" of a referral, or "Buka" of a student of "Daftar
 * mahasiswa": the student is picked on "Persetujuan konseling", and so
 * on "Publikasi data kesehatan mental", which is then brought into view.
 */
export function followUpOf(
  pick: (student: ConsentPick) => void,
  bringIntoView: () => void,
): (row: StudentRow) => void {
  return (row) => {
    pick(pickOf(row));
    bringIntoView();
  };
}
