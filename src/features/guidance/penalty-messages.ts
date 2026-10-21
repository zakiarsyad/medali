import type { ContinuationDecision, PenaltyStatus } from "./penalty-ids";
import { DECISION_WORDS, STATUS_WORDS } from "./penalty-words";

/*
 * What a save of a discipline penalty answers, in the words the screen
 * shows. Read by the screen parts in the browser, so nothing here may
 * take from the database code.
 */

export const NOT_ALLOWED_TO_RECORD = {
  ok: false,
  error:
    "Anda tidak berhak mencatat pelanggaran disiplin. Pencatatan dilakukan oleh Pembina Disiplin Mahasiswa dan Kepala Unit.",
} as const;

export const NOT_RECORDABLE = {
  ok: false,
  error:
    "Mahasiswa ini tidak dapat dicatat. Pilih mahasiswa aktif dari hasil pencarian.",
} as const;

export const PLACE_NEEDS_AGENCY = {
  ok: false,
  error:
    "Unit kerja di instansi asal hanya untuk mahasiswa yang punya instansi asal. Pilih lokasi kerja sosial yang lain.",
} as const;

/**
 * What a save answers when its key is that of a penalty it did not just
 * add: the form was sent before and changed since, or the key is not its
 * own.
 */
export const PENALTY_ALREADY_SENT = {
  ok: false,
  error:
    "Formulir ini sudah pernah terkirim, jadi isian yang sekarang tidak disimpan. Muat ulang halaman, lalu simpan lagi bila masih perlu.",
} as const;

export const NOT_ALLOWED_TO_FOLLOW_UP = {
  ok: false,
  error:
    "Anda tidak berhak menindaklanjuti hukuman disiplin. Tindak lanjut dilakukan oleh Pembina Disiplin Mahasiswa dan Kepala Unit.",
} as const;

export const PENALTY_NOT_FOUND = {
  ok: false,
  error: "Hukuman ini tidak ditemukan. Muat ulang halaman.",
} as const;

export const NOT_A_FOLLOW_UP_STATUS = {
  ok: false,
  error: "Pilih status Dijatuhkan, Sedang dijalani, atau Selesai dijalani.",
} as const;

export const STATUS_IS_SET = {
  ok: false,
  error:
    "Hukuman ini Ditetapkan karena mengakhiri status mahasiswa, jadi tidak dapat diubah.",
} as const;

export const NO_CONDITIONS = {
  ok: false,
  error:
    "Syarat melanjutkan studi hanya untuk hukuman berat jenjang pertama mahasiswa yang punya instansi asal.",
} as const;

/** Said under Keputusan while a tick is missing, and when the server refuses it then. */
export const CONTINUE_WHEN_ALL_MET =
  '"Melanjutkan studi" tersedia setelah semua syarat dicentang.';

export const CONDITIONS_NOT_MET = {
  ok: false,
  error: CONTINUE_WHEN_ALL_MET,
} as const;

export const NOT_A_CONDITION = {
  ok: false,
  error: "Pilih syarat melanjutkan studi dari daftar.",
} as const;

export const NOT_A_DECISION = {
  ok: false,
  error:
    "Pilih keputusan Menunggu pemenuhan syarat, Melanjutkan studi, atau Diberhentikan dengan hormat (ayat 8).",
} as const;

export const STATUS_UPDATED = "Status hukuman diperbarui.";

export const CONDITION_SAVED = "Syarat dicatat.";

export const DECISION_RECORDED = "Keputusan dicatat.";

/** What a status choice asks before it is sent. */
export function statusQuestion(name: string, status: PenaltyStatus): string {
  return `Ubah status hukuman ${name} menjadi "${STATUS_WORDS[status]}"?`;
}

/** What a Keputusan asks before it is sent. */
export function decisionQuestion(
  name: string,
  decision: ContinuationDecision,
): string {
  return `Catat keputusan "${DECISION_WORDS[decision]}" untuk ${name}?`;
}

/** What a kept penalty answers: whose it is and its status. */
export function savedMessage(name: string, status: PenaltyStatus): string {
  return `Pelanggaran ${name} disimpan dengan status ${STATUS_WORDS[status]}.`;
}
