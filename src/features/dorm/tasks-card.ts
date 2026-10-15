import type { FormState } from "@/ui/form-message";
import type { DormClarificationCard } from "./clarification-card";
import type { CleaningResult } from "./cleaning-ids";
import type { LeaveKind } from "./leave-ids";
import type { DecisionAnswer } from "./leave-messages";

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

/** What the answer to a press does to its card and its section. */
export interface TaskOutcome {
  /** What stays under the buttons of the card. */
  onCard: string | null;
  /** What the section says above its list, as the item leaves it. */
  onSection: FormState | null;
  /** Whether the page is read again. */
  reload: boolean;
}

/**
 * A kept decision and one refused as decided elsewhere first both take
 * the item off the list, so what they say goes above the section; any
 * other refusal stays on the card.
 */
export function taskOutcome(answer: DecisionAnswer): TaskOutcome {
  if (answer.stale) {
    return {
      onCard: null,
      onSection: { error: ALREADY_SETTLED, done: null },
      reload: true,
    };
  }
  const onSection = answer.done ? { error: null, done: answer.done } : null;
  return { onCard: answer.error, onSection, reload: false };
}

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

/**
 * A clarification BAM passed on, which waits for the decision of
 * Pengelola Asrama, as its card on Klarifikasi kehadiran shows it.
 */
export type ClarificationTask = DormClarificationCard;

/** A cleaning duty BAM assessed, which waits for validation. */
export interface CleaningTask {
  id: string;
  /** Tanggal, such as 12 Okt 2026. */
  day: string;
  /** Tempat: the place, or the room's own room, such as Kamar 101 (kamar sendiri). */
  place: string;
  /** Kamar, with its dorm, such as Dana Rakca · Kamar 101. */
  room: string;
  /** Whether it is a "Pembersihan ulang" of a duty not met. */
  isRepeat: boolean;
  result: CleaningResult;
  /** BAM's note; empty when none was written. */
  judgeNote: string;
  judgedByName: string | null;
  judgedAt: Date | null;
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
  clarifications: TaskSection<ClarificationTask> | null;
  cleaning: TaskSection<CleaningTask> | null;
  /** Perlu dipantau: residents still out past their return time. */
  outLate: number | null;
}

/** How many items wait for a decision in all; Perlu dipantau is no decision. */
export function waitingIn(tasks: DormTasks): number {
  const sections = [
    tasks.leaves,
    tasks.returns,
    tasks.clarifications,
    tasks.cleaning,
  ];
  let total = 0;
  for (const section of sections) total += section?.total ?? 0;
  return total;
}
