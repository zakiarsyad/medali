import type { Illness, NoteCategory } from "@/features/fitness/health-ids";

/*
 * Made-up health notes only, for made-up students who do not live in
 * the dorm.
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
