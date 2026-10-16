import type { Illness, NoteCategory } from "@/health-notes/health-ids";

/*
 * Made-up health notes only, for made-up students: those who do not live
 * in the dorm, and the dorm residents.
 */

/** A sample health note of one sample student. */
export interface SampleHealthNote {
  nim: string;
  /** How many days before today its Tanggal is. */
  daysAgo: number;
  examiner: string | null;
  illnesses: readonly { illness: Illness; note: string }[];
  otherHistory: string;
  medicine: string;
  advice: string;
  category: NoteCategory | null;
  /** Who saved it: the sample Penilai Mahasiswa or Kepala Unit. */
  savedAs: "assessor" | "head_of_unit";
}

/**
 * The sample notes, oldest first. Together with the sample fitness
 * scores they give the spec's three examples: a Prima score with a note
 * "Perlu perhatian", a Perlu tindak lanjut medis score with a note
 * "Baik", and no test with a note "Perlu perhatian". One student has a
 * note saved again, so an earlier note stays as history. Every student
 * here came by Alih program or is past the semesters spent in the dorm,
 * so none lives in the dorm.
 */
export const SAMPLE_HEALTH_NOTES: SampleHealthNote[] = [
  {
    nim: "9900240015",
    daysAgo: 60,
    examiner: "Tim kesehatan kampus",
    illnesses: [{ illness: "allergy", note: "" }],
    otherHistory: "",
    medicine: "",
    advice: "Hindari debu saat kerja bakti.",
    category: null,
    savedAs: "assessor",
  },
  {
    nim: "9900240051",
    daysAgo: 30,
    examiner: "dr. Sari Wulan",
    illnesses: [{ illness: "asthma", note: "sejak SMP" }],
    otherHistory: "",
    medicine: "Inhaler bila perlu",
    advice: "Bawa inhaler saat kegiatan fisik.",
    category: "attention",
    savedAs: "assessor",
  },
  {
    nim: "9900240050",
    daysAgo: 25,
    examiner: null,
    illnesses: [],
    otherHistory: "",
    medicine: "",
    advice: "Kondisi umum baik setelah pemeriksaan ulang.",
    category: "good",
    savedAs: "head_of_unit",
  },
  {
    nim: "9900230027",
    daysAgo: 15,
    examiner: "dr. Bima Pratama",
    illnesses: [{ illness: "heart_disease", note: "kontrol rutin tiap bulan" }],
    otherHistory: "",
    medicine: "Obat jantung dari dokter",
    advice: "Perlu evaluasi kardiologi sebelum kegiatan fisik berat.",
    category: "medical",
    savedAs: "head_of_unit",
  },
  {
    nim: "9900240002",
    daysAgo: 8,
    examiner: "Tim kesehatan kampus",
    illnesses: [{ illness: "gastric_disorder", note: "" }],
    otherHistory: "",
    medicine: "",
    advice: "Makan teratur, hindari kegiatan fisik berat saat kambuh.",
    category: "attention",
    savedAs: "assessor",
  },
  {
    nim: "9900240015",
    daysAgo: 5,
    examiner: "Tim kesehatan kampus",
    illnesses: [{ illness: "allergy", note: "debu dan udang" }],
    otherHistory: "Sinusitis",
    medicine: "Antihistamin bila kambuh",
    advice: "Hindari debu saat kerja bakti.",
    category: null,
    savedAs: "assessor",
  },
];

/** A sample health note of one sample dorm resident. */
export interface SampleDormHealthNote {
  /**
   * Which resident it is of, by place in the list of the running period's
   * residents that puts two of the sample Pengasuh's mentees first, then
   * the residents outside that Pengasuh's groups, by name.
   */
  resident: number;
  /** How many days before today its Tanggal is. */
  daysAgo: number;
  examiner: string | null;
  illnesses: readonly { illness: Illness; note: string }[];
  otherHistory: string;
  medicine: string;
  advice: string;
  category: NoteCategory | null;
  /** Who saved it: the sample BAM - Kesehatan or Kepala Unit. */
  savedAs: "bam_health" | "head_of_unit";
}

/**
 * The sample notes of dorm residents, oldest first: one in each
 * "Pertimbangan kategori", and one that follows the fitness test. The
 * first two residents are mentees of the sample Pengasuh, the others are
 * not, and the first
 * has a note saved again, so an earlier note stays as history.
 */
export const SAMPLE_DORM_HEALTH_NOTES: SampleDormHealthNote[] = [
  {
    resident: 0,
    daysAgo: 40,
    examiner: "Klinik kampus",
    illnesses: [{ illness: "asthma", note: "" }],
    otherHistory: "",
    medicine: "",
    advice: "Kontrol ke klinik bila sesak.",
    category: null,
    savedAs: "bam_health",
  },
  {
    resident: 2,
    daysAgo: 21,
    examiner: "dr. Laila Kusuma",
    illnesses: [{ illness: "diabetes", note: "tipe 1, sejak SMA" }],
    otherHistory: "",
    medicine: "Insulin sesuai anjuran dokter",
    advice: "Sediakan makanan ringan saat kegiatan panjang.",
    category: "medical",
    savedAs: "head_of_unit",
  },
  {
    resident: 1,
    daysAgo: 14,
    examiner: null,
    illnesses: [],
    otherHistory: "",
    medicine: "",
    advice: "Pulih dari demam, kondisi umum baik.",
    category: "good",
    savedAs: "bam_health",
  },
  {
    resident: 3,
    daysAgo: 10,
    examiner: "Tim kesehatan BAM",
    illnesses: [{ illness: "allergy", note: "kacang" }],
    otherHistory: "",
    medicine: "Antihistamin bila kambuh",
    advice: "Beri tahu petugas konsumsi.",
    category: null,
    savedAs: "bam_health",
  },
  {
    resident: 4,
    daysAgo: 6,
    examiner: "Tim kesehatan BAM",
    illnesses: [{ illness: "bone_joint_injury", note: "operasi lutut 2025" }],
    otherHistory: "",
    medicine: "",
    advice: "Hindari lari jarak jauh sampai kontrol berikutnya.",
    category: "attention",
    savedAs: "bam_health",
  },
  {
    resident: 0,
    daysAgo: 3,
    examiner: "Klinik kampus",
    illnesses: [{ illness: "asthma", note: "kambuh saat cuaca dingin" }],
    otherHistory: "",
    medicine: "Inhaler bila perlu",
    advice: "Bawa inhaler saat kegiatan fisik.",
    category: "attention",
    savedAs: "bam_health",
  },
];
