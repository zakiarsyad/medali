import { shownMoment } from "@/ui/day";
import type { KeptCount } from "./count-view";

/*
 * How "Penghitungan kehadiran" says where a count stands. Read in the
 * browser too, so nothing here may take from the database code.
 */

/**
 * Where the count stands: not announced, with the time of the last draft
 * when there is one, or announced, with when and by whom.
 */
export function countStatusWords(
  kept: Pick<KeptCount, "savedAt" | "announcedAt" | "announcedBy"> | null,
): string {
  if (kept === null) return "Belum diumumkan.";
  if (kept.announcedAt === null) {
    return `Belum diumumkan. Draf terakhir disimpan ${shownMoment(kept.savedAt)}.`;
  }
  const by = kept.announcedBy ?? "-";
  return `Ketidakhadiran sudah diumumkan ${shownMoment(kept.announcedAt)} oleh ${by}. Perbaikan dikirim dengan Umumkan ulang.`;
}

/** "(n) dari (m) peserta ditandai tidak hadir." */
export function absentWords(absent: number, participants: number): string {
  const all = participants.toLocaleString("id-ID");
  return `${absent.toLocaleString("id-ID")} dari ${all} peserta ditandai tidak hadir.`;
}

/** What is asked before an announcement goes out. */
export function announceQuestion(
  absent: number,
  activityName: string,
  isAgain: boolean,
): string {
  const start = isAgain ? "Umumkan ulang:" : "Umumkan";
  return `${start} ${absent.toLocaleString("id-ID")} mahasiswa tidak hadir pada ${activityName}?`;
}
