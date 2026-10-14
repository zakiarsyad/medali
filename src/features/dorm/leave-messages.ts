import type { LeaveStatus } from "./leave-ids";
import { STATUS_WORDS } from "./leave-words";

/** What asking for or cancelling leave answers to a role without the right. */
export const ASK_NOT_ALLOWED = {
  ok: false,
  error: "Anda tidak berhak mengajukan izin asrama.",
} as const;

/** What deciding answers to a role without the right. */
export const DECIDE_NOT_ALLOWED = {
  ok: false,
  error: "Anda tidak berhak menyetujui atau menolak izin asrama.",
} as const;

/** What asking answers to a student who lives in no dorm today. */
export const NOT_A_RESIDENT = {
  ok: false,
  error:
    "Izin asrama hanya dapat diajukan oleh mahasiswa yang tinggal di asrama.",
} as const;

/**
 * What a request answers when its key is that of a request it did not
 * just add: the form was sent before and changed since, or the key is not
 * its own.
 */
export const LEAVE_ALREADY_SENT = {
  ok: false,
  error:
    "Formulir ini sudah pernah terkirim, jadi isian yang sekarang tidak disimpan. Muat ulang halaman, periksa Riwayat izin saya, lalu ajukan lagi bila masih perlu.",
} as const;

export const LEAVE_OVERLAPS = {
  ok: false,
  error:
    "Waktu izin bertabrakan dengan izin lain yang masih diajukan atau disetujui.",
} as const;

/** What a cancel or a decision answers for a request it may not reach. */
export const LEAVE_NOT_FOUND = {
  ok: false,
  error: "Izin ini tidak ditemukan. Muat ulang halaman.",
} as const;

export const REJECTION_NEEDS_NOTE = {
  ok: false,
  error: "Tulis alasan penolakan di kolom catatan.",
} as const;

function statusWords(status: LeaveStatus): string {
  return STATUS_WORDS[status].toLowerCase();
}

/** What a cancel answers when the request no longer waits. */
export function tooLateToCancel(status: LeaveStatus) {
  return {
    ok: false,
    error: `Izin ini sudah ${statusWords(status)}, jadi tidak dapat dibatalkan lagi. Muat ulang halaman.`,
  } as const;
}

/** What a decision answers when the request no longer waits. */
export function tooLateToDecide(status: LeaveStatus) {
  return {
    ok: false,
    error: `Izin ini sudah ${statusWords(status)} lebih dulu, jadi keputusan Anda tidak disimpan. Muat ulang halaman.`,
  } as const;
}
