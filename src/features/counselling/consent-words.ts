import type { ConsentStatus, ConsentWay } from "./consent-ids";

/** The words of each status on screen. */
export const STATUS_WORDS: Record<ConsentStatus, string> = {
  waiting: "Menunggu",
  approved: "Disetujui",
  declined: "Ditolak",
  withdrawn: "Dicabut",
};

/** The status of a student who was never asked. */
export const NOT_ASKED_WORDS = "Belum diminta";

export const WAY_WORDS: Record<ConsentWay, string> = {
  online: "Persetujuan daring",
  paper: "Form tertulis",
};

/** What the student agrees to, as the prototype words it. */
export const CONSENT_TEXT =
  "Saya bersedia mengikuti layanan konseling dan mengizinkan konselor PKN STAN menggunakan hasil asesmen kesehatan mental saya untuk keperluan konseling. Kerahasiaan dijaga sesuai kode etik konselor, kecuali bila ada risiko terhadap keselamatan saya atau orang lain. Persetujuan ini dapat saya cabut kapan saja.";

export function sentToMessage(name: string): string {
  return `Permintaan persetujuan dikirim ke ${name}.`;
}

export const PAPER_RECORDED_MESSAGE = "Persetujuan tertulis dicatat.";

export const APPROVED_MESSAGE = "Terima kasih. Konselor akan menghubungi Anda.";

export const DECLINED_MESSAGE = "Permintaan ditolak.";

export const WITHDRAWN_MESSAGE = "Persetujuan dicabut.";

/**
 * What a press made on a status that changed since the screen showed
 * it is told: by someone else, or by the same press made twice.
 */
export const CHANGED_SINCE =
  "Status persetujuan sudah berubah, jadi tidak ada yang diubah. Status terbarunya ditampilkan.";

export const STUDENT_NOT_FOUND =
  "Mahasiswa tidak ditemukan. Cari dan pilih mahasiswa lagi.";

export const NOBODY_FOUND = "Tidak ada mahasiswa yang cocok.";
