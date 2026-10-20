import type { Instrument, ScreeningLevel } from "./screening-ids";
import type { DassScale } from "./screening-rules";

/*
 * The words of a mental health screening on screen. Read by the screen
 * parts in the browser, so nothing here may take from the database code.
 */

export const INSTRUMENT_WORDS: Record<Instrument, string> = {
  dass21: "DASS-21",
  srq20: "SRQ-20",
};

export const SCALE_WORDS: Record<DassScale, string> = {
  depression: "Depresi",
  anxiety: "Kecemasan",
  stress: "Stres",
};

/** "Tingkat" of each level. */
export const LEVEL_WORDS: Record<ScreeningLevel, string> = {
  normal: "Normal",
  mild: "Ringan",
  moderate: "Sedang",
  severe: "Berat",
  extremely_severe: "Sangat berat",
};

/** "Rekomendasi" of each level, when self-harm is not ticked. */
export const ADVICE_WORDS: Record<ScreeningLevel, string> = {
  normal: "Tidak perlu tindak lanjut",
  mild: "Psikoedukasi dan pemantauan",
  moderate: "Konseling",
  severe: "Konseling segera, pertimbangkan rujukan ke psikolog klinis",
  extremely_severe:
    "Konseling segera dan rujukan ke psikolog klinis atau psikiater",
};

/** "Rekomendasi" when self-harm is ticked, whatever the scores. */
export const CRISIS_ADVICE =
  "Tindak lanjut krisis hari ini sesuai protokol kampus";

/** The mark of a screening with self-harm ticked. */
export const RISK_WORDS = "Risiko";

export const SELF_HARM_WORDS =
  "Ada indikasi pikiran atau tindakan menyakiti diri";

export const PICK_STUDENT = "Pilih mahasiswa terlebih dahulu.";

export const DATE_MISSING = "Isi tanggal asesmen dengan tanggal yang benar.";

export const FUTURE_DATE = "Tanggal asesmen tidak boleh setelah hari ini.";

export const UNKNOWN_INSTRUMENT = "Pilih instrumen DASS-21 atau SRQ-20.";

export const NOTE_TOO_LONG =
  "Catatan konselor paling banyak 1.000 karakter. Persingkat catatan, lalu simpan lagi.";

/** What a sum outside its range is told. */
export function scoreOutOfRange(field: string, most: number): string {
  return `${field} harus bilangan bulat 0–${most}.`;
}

/** The name of the sum of SRQ-20 in its messages. */
export const SRQ_FIELD = 'Jumlah jawaban "ya" SRQ-20';

export const CONSENT_NEEDED =
  "Persetujuan konseling mahasiswa ini belum berstatus Disetujui, jadi asesmen tidak disimpan. Minta persetujuannya di menu Konseling terlebih dahulu.";

export const SCREENING_NOT_ALLOWED =
  "Anda tidak berhak mencatat asesmen kesehatan mental.";

export function savedMessage(name: string): string {
  return `Asesmen ${name} disimpan.`;
}

export const FORM_STALE =
  "Formulir ini sudah lama dibuka. Muat ulang halaman, lalu simpan lagi.";

/** What the form says while the picked student's consent is not Disetujui. */
export const CONSENT_FIRST =
  "Persetujuan konseling diperlukan terlebih dahulu. Asesmen dapat disimpan setelah persetujuan mahasiswa berstatus Disetujui; minta persetujuannya di menu Konseling.";
