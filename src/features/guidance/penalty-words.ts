import { CHARACTER_SCORE_CAP } from "@/discipline-penalties/score-limit";
import type {
  ContinuationCondition,
  ContinuationDecision,
  PenaltyStatus,
  SocialWorkForm,
  SocialWorkPlace,
} from "./penalty-ids";
import type { PenaltyRule, SocialWorkLength } from "./penalty-rules";

/*
 * The words of Pelanggaran disiplin. Read by the screen parts in the
 * browser, so nothing here may take from the database code.
 */

/** The lede of the tab for an account that records penalties. */
export const RECORDER_LEDE = `Catat pelanggaran disiplin dan tetapkan hukuman sesuai jenjangnya. Hukuman ringan dan sedang otomatis membatasi nilai karakter paling tinggi ${CHARACTER_SCORE_CAP}.`;

/** The lede of the tab for an account that only reads. */
export const READER_LEDE = `Data pelanggaran disiplin dan hukumannya. Hukuman ringan dan sedang otomatis membatasi nilai karakter paling tinggi ${CHARACTER_SCORE_CAP}.`;

/** What an account that only reads is told instead of the form. */
export const WHO_RECORDS =
  "Anda hanya dapat melihat data pelanggaran disiplin. Pencatatan pelanggaran dilakukan oleh Kepala Unit Pembangunan Karakter dan Pembina Disiplin Mahasiswa.";

/** What Pengasuh is told: the list holds their own mentees only. */
export const MENTEES_ONLY = "Menampilkan mahasiswa binaan Anda.";

export const NO_PENALTIES_FOUND = "Tidak ada pelanggaran pada filter ini.";

/** What "Rincian" shows while the server is asked for it. */
export const RINCIAN_LOADING = "Memuat rincian…";

/**
 * What "Rincian" shows when the server did not answer, refused, or knows
 * no such penalty: one message for all, so it tells nobody which.
 */
export const RINCIAN_FAILED = "Rincian tidak dapat dimuat. Coba lagi.";

export const TRY_AGAIN = "Coba lagi";

/** What one row of the list is, as the pager says it. */
export const PENALTY_NOUN = "pelanggaran";

export const STATUS_WORDS: Record<PenaltyStatus, string> = {
  imposed: "Dijatuhkan",
  serving: "Sedang dijalani",
  served: "Selesai dijalani",
  set: "Ditetapkan",
};

/** Syarat melanjutkan studi (ayat 7), in the prototype's wording. */
export const CONDITION_WORDS: Record<ContinuationCondition, string> = {
  served: "Telah selesai menjalani hukuman disiplin berat jenjang pertama",
  academic: "Memenuhi kurikulum akademik PKN STAN",
  character: "Memenuhi kurikulum pembangunan karakter",
  recommendation:
    "Memperoleh rekomendasi tertulis dari Pejabat Pimpinan Tinggi Pratama bidang SDM dan/atau kepatuhan internal di kantor pusat instansi asal",
  study_leave:
    "Memenuhi ketentuan tugas belajar PNS sesuai peraturan perundang-undangan",
};

export const DECISION_WORDS: Record<ContinuationDecision, string> = {
  pending: "Menunggu pemenuhan syarat",
  continue: "Melanjutkan studi",
  dismissed: "Diberhentikan dengan hormat (ayat 8)",
};

export const SOCIAL_WORK_FORM_WORDS: Record<SocialWorkForm, string> = {
  staff_help:
    "Membantu tugas atau kegiatan dosen, tenaga kependidikan, dan/atau pegawai",
  traffic: "Membantu pengaturan lalu lintas di lingkungan PKN STAN",
  grounds: "Merapikan dan membersihkan taman atau lingkungan PKN STAN",
  community: "Melakukan kegiatan sosial kemasyarakatan",
  other: "Bentuk kerja sosial lainnya",
};

export const SOCIAL_WORK_PLACE_WORDS: Record<SocialWorkPlace, string> = {
  campus: "Unit kerja di lingkungan PKN STAN",
  home_agency: "Unit kerja di instansi asal",
  outside: "Lembaga sosial atau lembaga lain di luar PKN STAN",
};

/** How long a kerja sosial lasts: "7 hari" or "8 bulan". */
export function lengthWords(length: SocialWorkLength): string {
  const unit = length.unit === "day" ? "hari" : "bulan";
  return `${length.amount} ${unit}`;
}

/** What a Jenjang does to nilai karakter, as the rules table says it. */
export function scoreEffectWords(rule: PenaltyRule): string {
  if (rule.outcome === "capped") {
    return `Paling tinggi ${CHARACTER_SCORE_CAP}`;
  }
  if (rule.outcome === "suspended") return "Mengulang semester berkenaan";
  return "-";
}

/** Bentuk kerja sosial as the list names them, with what "lainnya" is. */
export function formsWords(forms: SocialWorkForm[], other: string): string {
  return forms
    .map((form) =>
      form === "other" ? `Lainnya: ${other}` : SOCIAL_WORK_FORM_WORDS[form],
    )
    .join("; ");
}

/** A text of the rules as part of a sentence: its first letter small. */
export function inSentence(text: string): string {
  return text.charAt(0).toLowerCase() + text.slice(1);
}

/** A word as the start of a sentence: its first letter capital. */
export function capitalized(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * The suspension of Berat jenjang pertama as "Rincian" says it: the two
 * semesters from the one of the Tanggal pelanggaran, and the one to
 * repeat. Without that semester, only that there are two.
 */
export function suspensionWords(semester: number | null): string {
  if (semester === null) {
    return "Dua semester, terhitung mulai semester saat pelanggaran dilakukan; mengulang seluruh mata kuliah semester tersebut";
  }
  return `Semester ${semester}–${semester + 1}; mengulang seluruh mata kuliah semester ${semester}`;
}
