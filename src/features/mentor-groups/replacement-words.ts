import { isDay } from "@/db/is-day";
import { shownDay } from "@/ui/day";

/** What the sentence beside the tick box names. */
export interface ConfirmedChange {
  /** How many Aktif students the group holds. */
  members: number;
  groupCode: string;
  oldMentorName: string;
  /** Null while no spare mentor is chosen. */
  newMentorName: string | null;
  /** "Tanggal efektif" as typed. */
  startsOn: string;
  /** The day shown while the field holds no day. */
  today: string;
}

/**
 * The sentence beside the tick box: how many students of which group go
 * from whom to whom, and from which day.
 */
export function confirmWords(change: ConfirmedChange): string {
  const members = change.members.toLocaleString("id-ID");
  const newMentor = change.newMentorName ?? "pengasuh pengganti";
  const day = isDay(change.startsOn) ? change.startsOn : change.today;
  return `Seluruh ${members} mahasiswa ${change.groupCode} beralih dari ${change.oldMentorName} ke ${newMentor} mulai ${shownDay(day)}. Catatan pengasuhan sebelumnya tetap tersimpan atas nama pengasuh lama.`;
}

/** What "Tetapkan penggantian" says once it is saved for a later day. */
export function scheduledWords(startsOn: string): string {
  return `Penggantian dijadwalkan mulai ${shownDay(startsOn)}.`;
}

/** What the form says while Hasil evaluasi kurang has no evaluation to stand on. */
export function needsPoorEvaluationWords(groupCode: string): string {
  return `Belum ada evaluasi dengan hasil kurang untuk pengasuh ini di kelompok ${groupCode}.`;
}
