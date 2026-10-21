import type { PenaltyStatus } from "./penalty-ids";
import { STATUS_WORDS } from "./penalty-words";

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

/** What a kept penalty answers: whose it is and its status. */
export function savedMessage(name: string, status: PenaltyStatus): string {
  return `Pelanggaran ${name} disimpan dengan status ${STATUS_WORDS[status]}.`;
}
