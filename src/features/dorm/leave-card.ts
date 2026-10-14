import type { LeaveRow } from "./leave-row";
import { fitsKind, startPassedWords } from "./leave-rules";
import { KIND_SHORT_WORDS } from "./leave-words";
import type { ReportCard } from "./return-card";
import type { Timeliness } from "./return-rules";

/*
 * A leave request as its card shows it to staff. Read by the screen
 * parts in the browser, so nothing here may take from the database code.
 */

/** Who decided a request and what they noted. */
export interface DecisionWords {
  by: string;
  note: string;
}

export interface LeaveCard extends LeaveRow {
  name: string;
  nim: string;
  /** Where the student lives today, such as Asrama Dana Rakca, kamar 101. */
  room: string;
  /** Who approved or rejected it; null while it waits or once cancelled. */
  decision: DecisionWords | null;
  /** What Pengelola Asrama should look at before deciding. */
  warnings: string[];
  /** The latest report of a return, or null while there is none. */
  report: ReportCard | null;
  /** Whether the resident is out on it now, with no report that waits. */
  isOut: boolean;
  /** The actual return of leave that is Selesai; null before it. */
  returned: ReturnWords | null;
}

/** The actual return of a leave as its card says it. */
export interface ReturnWords {
  /** When, such as 14 Okt 2026, 16.20. */
  at: string;
  timeliness: Timeliness;
  /** Who recorded it directly; null when a report was validated. */
  recordedBy: string | null;
}

/**
 * The warnings on a request that waits, at a moment: its start has
 * passed, or its length does not fit its kind. A decided or cancelled
 * request has none.
 */
export function warningsOf(
  leave: {
    kind: LeaveRow["kind"];
    status: LeaveRow["status"];
    start: Date;
    end: Date;
  },
  now: Date,
): string[] {
  if (leave.status !== "submitted") return [];
  const warnings: string[] = [];
  if (leave.start < now) warnings.push(startPassedWords(leave.kind));
  if (!fitsKind(leave)) {
    const kind = KIND_SHORT_WORDS[leave.kind].toLowerCase();
    warnings.push(`Durasi tidak sesuai ketentuan izin ${kind}.`);
  }
  return warnings;
}
