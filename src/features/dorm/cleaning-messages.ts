import {
  CLEANING_NOTE_MAX_LENGTH,
  type CleaningResult,
  PLACE_NAME_MAX_LENGTH,
  PLACE_NAME_MIN_LENGTH,
  SEND_BACK_MIN_LETTERS,
} from "./cleaning-ids";
import type { StaleRefusal } from "./leave-messages";

/*
 * What Pembersihan asrama answers. Read by the screen parts in the
 * browser, so nothing here may take from the database code.
 */

/** What a change to Pembersihan asrama answers to a role without the right. */
export const CLEANING_NOT_ALLOWED = {
  ok: false,
  error: "Anda tidak berhak mengelola pembersihan asrama.",
} as const;

export const NAME_TOO_SHORT = {
  ok: false,
  error: `Nama tempat minimal ${PLACE_NAME_MIN_LENGTH} huruf.`,
} as const;

export const NAME_TOO_LONG = {
  ok: false,
  error: `Nama tempat paling panjang ${PLACE_NAME_MAX_LENGTH} huruf.`,
} as const;

export const NAME_TAKEN = {
  ok: false,
  error: "Tempat dengan nama ini sudah ada di asrama ini.",
} as const;

export const DORM_REFUSED = { ok: false, error: "Pilih asrama." } as const;

export const PLACE_NOT_FOUND = {
  ok: false,
  error: "Tempat tidak ditemukan. Muat ulang halaman.",
} as const;

export const DAY_REFUSED = { ok: false, error: "Pilih tanggal." } as const;

export const DAY_PAST = {
  ok: false,
  error: "Tanggal sudah lewat. Pilih hari ini atau sesudahnya.",
} as const;

export const ROOM_MISSING = {
  ok: false,
  error: "Pilih kamar bertugas.",
} as const;

export const ASSIGN_NOT_FOUND = {
  ok: false,
  error: "Tempat atau kamar tidak ditemukan. Muat ulang halaman.",
} as const;

export const ROOM_EMPTY = {
  ok: false,
  error: "Kamar ini tidak berpenghuni. Muat ulang halaman.",
} as const;

export const PLACE_TAKEN = {
  ok: false,
  error:
    "Tempat ini sudah ditugaskan ke kamar lain pada tanggal ini. Muat ulang halaman.",
} as const;

export const NOT_PLOTTED = "Kamar asrama ini belum diploting.";

export const DUTY_NOT_FOUND = {
  ok: false,
  error: "Tugas tidak ditemukan atau sudah lewat. Muat ulang halaman.",
} as const;

export const DUTY_ASSIGNED = "Kamar ditugaskan.";

export const ALL_SCHEDULED = "Semua kamar sudah dijadwalkan.";

export function ownRoomsAssigned(count: number): string {
  return `${count.toLocaleString("id-ID")} tugas kamar dijadwalkan.`;
}

export const DUTY_CANCELLED = "Tugas dibatalkan.";

export function placeAdded(name: string): string {
  return `Tempat ${name} ditambahkan.`;
}

export const PLACE_RENAMED = "Nama tempat diperbarui.";

export function placeRemoved(name: string): string {
  return `Tempat ${name} dihapus.`;
}

export function placeRestored(name: string): string {
  return `Tempat ${name} dikembalikan.`;
}

export const JUDGED_NOT_CANCELLED = {
  ok: false,
  error: "Tugas yang sudah dinilai tidak dapat dibatalkan.",
} as const;

export const JUDGE_NOT_ALLOWED = {
  ok: false,
  error: "Anda tidak berhak menilai pembersihan asrama.",
} as const;

export const ASSESSED_DUTY_NOT_FOUND = {
  ok: false,
  error: "Tugas tidak ditemukan. Muat ulang halaman.",
} as const;

export const RESULT_UNKNOWN = {
  ok: false,
  error: "Pilih Memenuhi atau Tidak memenuhi.",
} as const;

export const JUDGE_NOTE_NEEDED = {
  ok: false,
  error: "Tulis catatan bagian yang belum bersih.",
} as const;

export const CLEANING_NOTE_TOO_LONG = {
  ok: false,
  error: `Catatan paling banyak ${CLEANING_NOTE_MAX_LENGTH} huruf.`,
} as const;

export const JUDGED_TOO_EARLY = {
  ok: false,
  error: "Tugas ini belum dapat dinilai sebelum tanggalnya.",
} as const;

export const JUDGED_FIRST = {
  ok: false,
  error: "Tugas ini sudah dinilai oleh petugas lain. Muat ulang halaman.",
} as const;

/** What a kept judgement says, by its result. */
export const JUDGED_WORDS: Record<CleaningResult, string> = {
  met: "Dinilai memenuhi. Menunggu validasi Pengelola Asrama.",
  not_met: "Dinilai tidak memenuhi. Menunggu validasi Pengelola Asrama.",
};

export const VALIDATE_NOT_ALLOWED = {
  ok: false,
  error: "Anda tidak berhak memvalidasi penilaian pembersihan asrama.",
} as const;

/**
 * Said of a duty that is no longer Dinilai BAM, as when it was sent back
 * first: the list it was pressed on is out of date.
 */
export const NOT_JUDGED_YET: StaleRefusal = {
  ok: false,
  error: "Tugas ini belum dinilai BAM. Muat ulang halaman.",
  stale: true,
};

/** Said of a duty validated first: the list it was pressed on is out of date. */
export const DECIDED_FIRST: StaleRefusal = {
  ok: false,
  error:
    "Penilaian ini sudah diputuskan oleh petugas lain. Muat ulang halaman.",
  stale: true,
};

export const SEND_BACK_REASON_NEEDED = {
  ok: false,
  error: `Tulis alasan penolakan minimal ${SEND_BACK_MIN_LETTERS} huruf.`,
} as const;

export const SEND_BACK_REASON_TOO_LONG = {
  ok: false,
  error: `Alasan penolakan paling banyak ${CLEANING_NOTE_MAX_LENGTH} huruf.`,
} as const;

export const SENT_BACK = "Penilaian dikembalikan ke BAM.";

export const VALIDATED_MET = "Divalidasi: +1 poin untuk kamar.";

/** What a validated Tidak memenuhi says, with the day of its repeat in words. */
export function validatedNotMet(repeatDay: string): string {
  return `Divalidasi: −1 poin. Pembersihan ulang dijadwalkan ${repeatDay}.`;
}

export const VALIDATED_WITHOUT_REPEAT =
  "Divalidasi: −1 poin. Pembersihan ulang tidak dijadwalkan karena tempat atau kamar sudah dihapus.";
