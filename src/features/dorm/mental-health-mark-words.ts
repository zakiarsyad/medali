/*
 * How "Potensi kesehatan mental" is written on screen, in the
 * prototype's words. Read by the screen parts in the browser, so nothing
 * here may take from the database code.
 */

import { type MarkCategory, OBSERVATION_MAX } from "./mental-health-mark-ids";

/** The choices of "Kategori potensi"; "Tidak ada indikasi" is no mark. */
export const NO_MARK_WORDS = "Tidak ada indikasi";

export const MARK_CHOICE_WORDS: Record<MarkCategory, string> = {
  monitor: "Potensi: perlu pemantauan",
  refer: "Potensi: perlu dirujuk ke konselor",
};

/** The badge of a mark in the list. */
export const MARK_BADGE_WORDS: Record<MarkCategory, string> = {
  monitor: "Potensi kesehatan mental · pantau",
  refer: "Potensi kesehatan mental · rujuk konselor",
};

/**
 * The line under "Potensi kesehatan mental" in the form. Konselor is
 * left out while their referral list is not built, so the line names
 * only who sees the mark today.
 */
export const MARK_FORM_NOTE =
  "Penanda awal berdasarkan pengamatan, bukan diagnosis. Hanya terlihat oleh BAM - Kesehatan, Kepala Unit Pembangunan Karakter, Pengelola Asrama, dan pengasuh mahasiswa ybs.";

export const OBSERVATION_PLACEHOLDER =
  "Misalnya menarik diri, sulit tidur, sering menangis";

export const REFERRAL_NEEDS_OBSERVATION =
  "Isi pengamatan untuk rujukan ke konselor.";

export const UNKNOWN_MARK =
  "Pilihan kategori potensi tidak dikenal, jadi catatan tidak disimpan. Muat ulang halaman, lalu isi lagi.";

export const OBSERVATION_TOO_LONG = `Pengamatan terlalu panjang, jadi catatan tidak disimpan. Pengamatan paling banyak ${OBSERVATION_MAX} karakter.`;

export const NOT_ALLOWED_TO_MARK =
  "Anda tidak berhak mengisi penanda potensi kesehatan mental. Penanda diisi oleh BAM - Kesehatan dan Kepala Unit Pembangunan Karakter.";

/** What a save says when it kept a mark and no health note. */
export function savedMarkMessage(name: string): string {
  return `Penanda potensi kesehatan mental ${name} disimpan.`;
}

/** What is added to the saved note's message when the mark was kept too. */
export const MARK_SAVED_TOO = "Penanda potensi kesehatan mental juga disimpan.";

/** The hint of the number "Potensi kesehatan mental". */
export function referredHint(referred: number): string {
  return `${referred.toLocaleString("id-ID")} perlu dirujuk ke konselor`;
}

/** The line above the list when it is filtered by "Potensi kesehatan mental". */
export function markLine(matching: number, noun: string): string {
  return `${matching.toLocaleString("id-ID")} ${noun} dengan penanda potensi kesehatan mental.`;
}

/** What the list holds, for an account that reads marks. */
export const MARKED_LIST_SUB =
  "Penghuni yang memiliki riwayat penyakit, catatan kesehatan dengan pertimbangan kategori, berkategori perlu tindak lanjut medis, atau penanda potensi kesehatan mental.";
