import type { SikuKind, SikuReason } from "./siku-ids";

/** Each kind of entry as the screens name it. */
export const KIND_WORDS: Record<SikuKind, string> = {
  gain: "Penambahan",
  loss: "Pengurangan",
};

/** Each reason as the screens name it, in the prototype's words. */
export const REASON_WORDS: Record<SikuReason, string> = {
  social_media_campaign: "Melakukan kampanye konten media sosial",
  knowledge_sharing: "Melakukan sosialisasi/knowledge sharing",
  training_speaker: "Sebagai narasumber pelatihan/workshop",
  peer_mentoring: "Melakukan pembimbingan mahasiswa lain",
  spiritual_activity: "Aktif dalam kegiatan spiritual",
  student_violation: "Pelanggaran mahasiswa",
  discipline_penalty: "Hukuman disiplin mahasiswa",
  unannounced_absence:
    "Ketidakhadiran kegiatan pembangunan karakter tanpa pemberitahuan",
  director_decision:
    "Ketentuan lain sesuai keputusan Direktur/Wakil Direktur Kemahasiswaan",
};

/** What Dasar says of a gain an approved request of a student made. */
export const REQUEST_BASIS = "Pengajuan mahasiswa";

/**
 * What an entry rests on, as Dasar shows it: the letter of a decision of
 * the Direktur, a student's request, or nothing.
 */
export function basisOf(entry: {
  basis: string;
  fromRequest: boolean;
}): string {
  if (entry.fromRequest) return REQUEST_BASIS;
  return entry.basis;
}

/** Points with their sign, such as +3 or −2, and "-" for none. */
export function signedPoints(points: number, kind: SikuKind): string {
  if (points === 0) return "-";
  return `${kind === "gain" ? "+" : "−"}${points.toLocaleString("id-ID")}`;
}

/** A change of SIKU with its sign, such as +3 or −2. */
export function signedChange(change: number): string {
  if (change >= 0) return `+${change.toLocaleString("id-ID")}`;
  return `−${(-change).toLocaleString("id-ID")}`;
}

/** The mean SIKU with one decimal, such as 66,4, or "-" with no student. */
export function shownMean(mean: number | null): string {
  if (mean === null) return "-";
  return mean.toLocaleString("id-ID", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}
