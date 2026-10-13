import { shownDay } from "@/ui/day";
import { alreadyScheduledWords } from "./replacement-words";

/** What a save answers to any role but Kepala Unit. */
export const NOT_ALLOWED_TO_REPLACE = {
  ok: false,
  error: "Anda tidak berhak menetapkan penggantian pengasuh.",
} as const;

export const NO_MENTOR_TO_REPLACE = {
  ok: false,
  error:
    "Kelompok ini belum memiliki pengasuh, sehingga belum ada yang diganti.",
} as const;

export const STARTS_BEFORE_TODAY = {
  ok: false,
  error:
    "Tanggal efektif tidak boleh sebelum hari ini. Pilih hari ini atau tanggal sesudahnya.",
} as const;

/**
 * What a save is told when the group has another mentor than the one the
 * form was filled in for: the reason, the status and the tick were chosen
 * for that mentor, not for the one who holds the group now.
 */
export const MENTOR_CHANGED = {
  ok: false,
  error:
    "Pengasuh kelompok ini sudah berganti. Muat ulang halaman, lalu periksa lagi.",
} as const;

/**
 * What a save is told for a start date before the day the mentor of today
 * took the group: that mentor's time with the group cannot end before it
 * began.
 */
export function startsBeforeOldMentor(since: string) {
  return {
    ok: false,
    error: `Tanggal efektif tidak boleh sebelum pengasuh saat ini mulai mengasuh kelompok ini, ${shownDay(since)}.`,
  } as const;
}

/** What a save is told when Hasil evaluasi kurang has no evaluation to stand on. */
export const NEEDS_POOR_EVALUATION = {
  ok: false,
  error:
    "Evaluasi terakhir pengasuh ini di kelompok tersebut bukan Kurang, sehingga alasan Hasil evaluasi kurang belum bisa dipakai. Lakukan evaluasi dulu, atau pilih alasan lain.",
} as const;

export const NOT_A_SPARE_MENTOR = {
  ok: false,
  error:
    "Pengasuh pengganti ini bukan pengasuh cadangan lagi. Pilih pengasuh cadangan lain dari daftar.",
} as const;

/** What a save is told for a group that has a Terjadwal replacement already. */
export function alreadyScheduled(startsOn: string) {
  return { ok: false, error: alreadyScheduledWords(startsOn) } as const;
}

/** What a save is told for a new mentor another Terjadwal replacement names. */
export const KEPT_FOR_ANOTHER_GROUP = {
  ok: false,
  error:
    "Pengasuh pengganti ini sudah ditetapkan pada penggantian terjadwal kelompok lain. Pilih pengasuh cadangan lain, atau batalkan penggantian itu dulu di riwayat.",
} as const;
