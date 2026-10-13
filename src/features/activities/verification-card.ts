import { shownMoment } from "@/ui/day";
import type { FormState } from "@/ui/form-message";
import type { AttendanceStatus } from "./attendance-status";

/*
 * Read by the cards in the browser, so nothing here may take from the
 * database code: that would send it to the browser with the cards.
 */

/**
 * An attendance for which a photo was sent, as its card shows it to
 * Pegawai UPK, every line in words already: the server writes the times,
 * so each browser shows the same.
 */
export interface VerificationCard {
  id: string;
  /** When the photo was sent, written so that the oldest sorts first. */
  sentAt: string;
  name: string;
  nim: string;
  program: string;
  activity: string;
  /** The time the photo was sent, as the card says it. */
  sent: string;
  isOutsideDates: boolean;
  /** Whether a file is kept for it here, so the picture can be shown. */
  hasPhoto: boolean;
  status: AttendanceStatus;
  /** The reason of a rejection, or what else was noted. Empty with none. */
  note: string;
  /** The name of who decided it, or null while it waits. */
  decidedBy: string | null;
}

/**
 * What a decision on a card answers: the words to show, and the card as
 * it stands now, or null when there is no such card.
 */
export interface DecisionAnswer {
  state: FormState;
  card: VerificationCard | null;
}

export const NO_PHOTO_HERE = "Foto tidak tersimpan di sini.";
export const OUTSIDE_DATES = "Di luar tanggal kegiatan";

export function sentTimeWords(sentAt: Date): string {
  return `Dikirim ${shownMoment(sentAt)}`;
}

/** Where the picture of a card is asked from the server. */
export function photoAddressOf(attendanceId: string): string {
  return `/kegiatan/ppks/foto/${attendanceId}`;
}

/** What a decided card says beside its status: the reason and who decided. */
export function decisionWords(
  card: Pick<VerificationCard, "note" | "decidedBy">,
): string {
  const parts = [card.note, card.decidedBy ?? ""];
  return parts.filter((part) => part !== "").join(" · ");
}
