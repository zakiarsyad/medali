import { shownMoment } from "@/ui/day";
import type { CoveredActivity } from "./leave-cover";
import type { LeaveKind, LeaveStatus, SpecialReason } from "./leave-ids";
import { hoursBetween, hoursWords } from "./leave-time";
import { SPECIAL_REASON_WORDS } from "./leave-words";

/*
 * A leave request as the screens show it. Read by the screen parts in
 * the browser, so nothing here may take from the database code.
 */

/** What a kept request holds that the screens show. */
export interface KeptLeave {
  id: string;
  kind: LeaveKind;
  startsAt: Date;
  endsAt: Date;
  specialReason: SpecialReason | null;
  purpose: string;
  destination: string;
  contact: string;
  status: LeaveStatus;
  decisionNote: string;
}

/**
 * A request with every time in words already: the server writes them,
 * so each browser shows the same.
 */
export interface LeaveRow {
  id: string;
  kind: LeaveKind;
  status: LeaveStatus;
  /** Berangkat or Dari, and Kembali or Sampai, such as 14 Okt 2026, 19.30. */
  start: string;
  end: string;
  /** How long it lasts, such as 7 jam. */
  length: string;
  /** Keperluan, after Jenis keperluan for Izin khusus. */
  purpose: string;
  destination: string;
  contact: string;
  decisionNote: string;
  /** The dorm activities an ITMK covers; none for the other kinds. */
  covered: CoveredActivity[];
}

/** Keperluan as the screens show it: Izin khusus names Jenis keperluan first. */
export function purposeWords(
  leave: Pick<KeptLeave, "specialReason" | "purpose">,
): string {
  if (leave.specialReason === null) return leave.purpose;
  return `${SPECIAL_REASON_WORDS[leave.specialReason]}: ${leave.purpose}`;
}

export function rowOfLeave(
  leave: KeptLeave,
  covered: CoveredActivity[],
): LeaveRow {
  return {
    id: leave.id,
    kind: leave.kind,
    status: leave.status,
    start: shownMoment(leave.startsAt),
    end: shownMoment(leave.endsAt),
    length: hoursWords(hoursBetween(leave.startsAt, leave.endsAt)),
    purpose: purposeWords(leave),
    destination: leave.destination,
    contact: leave.contact,
    decisionNote: leave.decisionNote,
    covered,
  };
}

/** What a history says of the activities an ITMK covers. */
export function coveredCountWords(row: Pick<LeaveRow, "covered">): string {
  if (row.covered.length === 0) return "Tidak ada kegiatan asrama";
  return `${row.covered.length} kegiatan asrama dianggap hadir`;
}
