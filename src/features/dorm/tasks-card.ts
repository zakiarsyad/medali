import type { LeaveKind } from "./leave-ids";

/*
 * What waits for Pengelola Asrama on Tugas saya, as the cards show it.
 * Read by the screen parts in the browser, so nothing here may take from
 * the database code.
 */

/** How many items a section shows at most: the oldest. */
export const TASKS_SHOWN = 20;

/** What a section says when nothing in it waits. */
export const NOTHING_WAITS = "Tidak ada yang menunggu.";

/** What a press on an item says when it was decided or cancelled elsewhere first. */
export const ALREADY_SETTLED = "Sudah diproses. Daftar diperbarui.";

/** A leave request that waits for approval. */
export interface LeaveTask {
  id: string;
  name: string;
  nim: string;
  /** Where the student lives today, such as Asrama Dana Rakca, kamar 101. */
  room: string;
  kind: LeaveKind;
  /** Berangkat or Dari, and Kembali or Sampai, such as 14 Okt 2026, 19.30. */
  start: string;
  end: string;
  /** Keperluan, after Jenis keperluan for Izin khusus. */
  purpose: string;
  /** Tujuan; empty when none was given, and always for ITMK. */
  destination: string;
  /** Whether its start has passed. */
  startPassed: boolean;
}

/** A report of a return that BAM - BPHK verified and that waits for validation. */
export interface ReturnTask {
  reportId: string;
  name: string;
  nim: string;
  room: string;
  kind: LeaveKind;
  /** Batas kembali: the return time of the leave. */
  deadline: string;
  /** When the report was sent. */
  reportedAt: string;
  /** How many minutes after Batas kembali it was sent; 0 when on time. */
  lateMinutes: number;
  /** Catatan BAM; empty when BAM wrote none. */
  bamNote: string;
  hasPhoto: boolean;
}

/** The oldest items of a section, and how many wait in all. */
export interface TaskSection<Item> {
  items: Item[];
  total: number;
}

/**
 * What waits for an account: a section is null when the account may not
 * decide what it holds, and `outLate` null when it may not see leave.
 */
export interface DormTasks {
  leaves: TaskSection<LeaveTask> | null;
  returns: TaskSection<ReturnTask> | null;
  /** Perlu dipantau: residents still out past their return time. */
  outLate: number | null;
}

/** How many items wait for a decision in all; Perlu dipantau is no decision. */
export function waitingIn(tasks: DormTasks): number {
  return (tasks.leaves?.total ?? 0) + (tasks.returns?.total ?? 0);
}
