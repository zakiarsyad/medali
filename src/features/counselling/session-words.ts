import type { FollowUp, SessionKind } from "./session-ids";

/*
 * The words of counselling sessions on screen, as the prototype has
 * them. Read by the screen parts in the browser.
 */

export const SESSION_KIND_WORDS: Record<SessionKind, string> = {
  individual_in_person: "Individu tatap muka",
  individual_online: "Individu daring",
  group: "Kelompok",
};

export const FOLLOW_UP_WORDS: Record<FollowUp, string> = {
  next_session: "Sesi lanjutan",
  monitoring: "Pemantauan",
  refer_psychologist: "Rujuk ke psikolog klinis",
  refer_psychiatrist: "Rujuk ke psikiater",
  closed: "Selesai",
};

/** Why no session can be written for a student without consent. */
export const NEEDS_CONSENT =
  "Sesi konseling hanya dapat dicatat setelah mahasiswa menyetujui form consent.";

export const SESSION_SAVED = "Sesi konseling dicatat.";

export const PICK_SESSION_DAY = "Isi Tanggal sesi dengan tanggal yang benar.";

export const DAY_IN_FUTURE =
  "Tanggal sesi tidak boleh setelah hari ini. Pilih hari ini atau sebelumnya.";

export const PICK_SESSION_CHOICES =
  "Pilih Jenis, Topik utama, dan Tindak lanjut dari daftar.";

export const NOTES_EMPTY = "Isi Catatan sesi (rahasia).";

export const NOTES_TOO_LONG = "Catatan sesi paling panjang 5.000 karakter.";

export const PICK_NEXT_DAY =
  "Isi Sesi berikutnya dengan tanggal yang benar, atau kosongkan.";

export const NEXT_BEFORE_DAY =
  "Sesi berikutnya tidak boleh sebelum Tanggal sesi.";

export const SESSION_NOT_ALLOWED =
  "Anda tidak memiliki hak untuk mencatat sesi konseling.";

export const SESSION_ALREADY_SENT =
  "Sesi ini sudah dicatat. Muat ulang halaman untuk mencatat sesi baru.";

export const SCHEDULE_HAS_SESSION =
  "Sesi untuk jadwal ini sudah dicatat. Muat ulang halaman.";

export const SCHEDULE_NOT_DONE =
  "Jadwal ini tidak ditemukan atau belum Selesai. Muat ulang halaman.";
