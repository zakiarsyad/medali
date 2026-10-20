import { CATEGORY_WORDS } from "./note-words";
import type { NoteCategory } from "./violation-note-ids";

/*
 * What a save or a removal of a violation note answers, in the words the
 * screen shows. Read by the screen parts in the browser, so nothing here
 * may take from the database code.
 */

export const NOT_ALLOWED_TO_WRITE = {
  ok: false,
  error:
    "Anda tidak berhak mencatat atau menghapus catatan pelanggaran. Catatan diisi oleh Pembina Disiplin Mahasiswa dan Kepala Unit.",
} as const;

export const NOT_WRITABLE = {
  ok: false,
  error:
    "Mahasiswa ini tidak dapat dicatat. Pilih mahasiswa aktif dari hasil pencarian.",
} as const;

/**
 * What a save answers when its key is that of a note it did not just
 * add: the form was sent before and changed since, or the key is not its
 * own.
 */
export const NOTE_ALREADY_SENT = {
  ok: false,
  error:
    "Formulir ini sudah pernah terkirim, jadi isian yang sekarang tidak disimpan. Muat ulang halaman, lalu simpan lagi bila masih perlu.",
} as const;

export const NOTE_NOT_FOUND = {
  ok: false,
  error: "Catatan pelanggaran ini tidak ditemukan. Muat ulang halaman.",
} as const;

export const ALREADY_REMOVED = {
  ok: false,
  error:
    "Catatan pelanggaran ini sudah dihapus sebelumnya. Muat ulang halaman untuk melihat daftar terbaru.",
} as const;

export const REMOVE_QUESTION = "Hapus catatan pelanggaran ini?";

export const REMOVED = "Catatan dihapus.";

/** What a kept note answers: whose it is and its Kategori. */
export function savedMessage(name: string, category: NoteCategory): string {
  return `Catatan pelanggaran ${name} disimpan sebagai ${CATEGORY_WORDS[category]}.`;
}
