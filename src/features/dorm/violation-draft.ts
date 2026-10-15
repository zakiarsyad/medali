import type { DormId } from "@/dorms/dorms";
import type { Parsed } from "@/parsed";
import { momentOf } from "./leave-time";
import type { Punishment } from "./violation-ids";
import { NEEDS_STUDENT, parseViolationRow } from "./violation-input";
import type { ViolationPick } from "./violation-residents";
import { appealEndOf } from "./violation-status";
import { shownHour } from "./violation-words";

/*
 * The list under the form while it is filled in. Read by the screen parts
 * in the browser, so nothing here may take from the database code.
 */

/** One row of the list, with the student as the form shows them. */
export interface DraftRow {
  /** Tells two rows of one student apart in the list. */
  key: string;
  studentId: string;
  name: string;
  nim: string;
  dorm: DormId;
  reason: string;
  punishment: Punishment;
  otherPunishment: string;
}

/** What is typed for the next row. */
export interface TypedRow {
  reason: string;
  punishment: string;
  otherPunishment: string;
}

export const ANNOUNCED_ON_SAVE =
  "Jam pengumuman sudah lewat: pelanggaran langsung diumumkan saat disimpan.";

/**
 * "Tambahkan ke daftar": the list with the picked student's row after the
 * others, or why it is refused, by the same rules the server keeps.
 */
export function withDraftRow(
  rows: readonly DraftRow[],
  picked: ViolationPick | null,
  typed: TypedRow,
  ownStudentId: string | null,
  key: string,
): Parsed<DraftRow[]> {
  if (picked === null) return { ok: false, error: NEEDS_STUDENT };
  const parsed = parseViolationRow(
    { studentId: picked.id, ...typed },
    ownStudentId,
  );
  if (!parsed.ok) return parsed;
  const { name, nim, dorm } = picked;
  return {
    ok: true,
    value: [...rows, { ...parsed.value, key, name, nim, dorm }],
  };
}

/** "Hapus": the list without one row. */
export function withoutDraftRow(
  rows: readonly DraftRow[],
  key: string,
): DraftRow[] {
  return rows.filter((row) => row.key !== key);
}

/**
 * The line beside "Simpan dan jadwalkan publikasi": when the list will be
 * announced and until when an appeal is possible, by the clock of the
 * screen. The server decides again by its own clock.
 */
export function announcementNote(
  announceDay: string,
  announceTime: string,
  now: Date,
): string {
  const at = momentOf(`${announceDay}T${announceTime}`);
  if (at === null) return "";
  if (at <= now) return ANNOUNCED_ON_SAVE;
  return `Diumumkan ${shownHour(at)}; batas advokasi ${shownHour(appealEndOf(at))}.`;
}
