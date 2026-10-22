import type { AssessmentSource } from "@/features/character-assessment/assessment-ids";

/*
 * Made-up character assessments only, for the made-up students.
 */

/** A sample assessment, saved some days ago. */
export interface SampleAssessment {
  nim: string;
  /** Mandiri, Empati, Disiplin, Adaptif, Loyal and Integritas, in that order. */
  scores: readonly [number, number, number, number, number, number];
  source: AssessmentSource;
  note: string;
  daysAgo: number;
  /** Who saved it: the sample Penilai Mahasiswa or Kepala Unit. */
  enteredAs: "assessor" | "head_of_unit";
}

/**
 * A day this many days ago or more always falls before the running
 * period, which lasts six months at most.
 */
export const EARLIER = 190;

/** A day fewer days ago than this falls in the running period, but in its first days. */
export const RECENT = 10;

/**
 * The sample assessments, oldest first. Some students have more than
 * one, some only one made in an earlier period, some only one made in
 * the running period, and most none. D3 Pajak students are among them,
 * for the sample Ketua Program Studi, and so are mentees of the sample
 * Pengasuh. Some latest ones are low, so Pembinaan karakter lists a
 * student of each level: Gita Purba, a mentee of the sample Pengasuh,
 * and Lutfi Tarigan Intensif, Nanda Gunawan of D3 Pajak and Citra
 * Nasution Sedang, and Fikri Wibowo Ringan.
 */
export const SAMPLE_ASSESSMENTS: SampleAssessment[] = [
  {
    nim: "9900230052",
    scores: [70, 72, 68, 74, 70, 71],
    source: "medali_instrument",
    note: "Asesmen awal tahun dengan instrumen MEDALI.",
    daysAgo: EARLIER + 210,
    enteredAs: "assessor",
  },
  {
    nim: "9900240011",
    scores: [66, 70, 62, 68, 72, 70],
    source: "mentor_observation",
    note: "Sering terlambat apel pagi, membaik setelah pendampingan.",
    daysAgo: EARLIER + 60,
    enteredAs: "assessor",
  },
  {
    nim: "9900230001",
    scores: [78, 80, 76, 74, 82, 80],
    source: "mentor_board_meeting",
    note: "",
    daysAgo: EARLIER + 20,
    enteredAs: "head_of_unit",
  },
  {
    nim: "9900240014",
    scores: [74, 76, 70, 72, 75, 78],
    source: "mentor_observation",
    note: "Aktif dalam kepanitiaan, perlu lebih tertib waktu.",
    daysAgo: EARLIER + 15,
    enteredAs: "assessor",
  },
  {
    nim: "9900230052",
    scores: [76, 78, 74, 78, 76, 77],
    source: "mentor_observation",
    note: "",
    daysAgo: EARLIER + 10,
    enteredAs: "assessor",
  },
  {
    nim: "9900230027",
    scores: [88, 86, 90, 85, 87, 89],
    source: "medali_instrument",
    note: "Menjadi teladan disiplin di asrama.",
    daysAgo: EARLIER + 5,
    enteredAs: "assessor",
  },
  {
    nim: "9900230001",
    scores: [80, 78, 84, 72, 82, 86],
    source: "medali_instrument",
    note: "Kenaikan pada Disiplin dan Integritas.",
    daysAgo: 8,
    enteredAs: "assessor",
  },
  {
    nim: "9900250007",
    scores: [55, 58, 60, 57, 59, 61],
    source: "mentor_observation",
    note: "Sering tidak hadir apel dan kegiatan asrama.",
    daysAgo: 7,
    enteredAs: "assessor",
  },
  {
    nim: "9900230052",
    scores: [82, 84, 80, 83, 81, 85],
    source: "peer_assessment",
    note: "Dinilai teman sekelompok sebagai penggerak kegiatan.",
    daysAgo: 6,
    enteredAs: "assessor",
  },
  {
    nim: "9900250012",
    scores: [57, 59, 56, 60, 58, 58],
    source: "mentor_board_meeting",
    note: "",
    daysAgo: 5,
    enteredAs: "head_of_unit",
  },
  {
    nim: "9900230006",
    scores: [70, 72, 56, 75, 74, 73],
    source: "medali_instrument",
    note: "Perlu perhatian pada Disiplin.",
    daysAgo: 5,
    enteredAs: "assessor",
  },
  {
    nim: "9900240011",
    scores: [72, 74, 70, 73, 75, 74],
    source: "self_assessment",
    note: "",
    daysAgo: 4,
    enteredAs: "assessor",
  },
  {
    nim: "9900250013",
    scores: [85, 85, 85, 85, 85, 85],
    source: "mentor_board_meeting",
    note: "",
    daysAgo: 3,
    enteredAs: "head_of_unit",
  },
  {
    nim: "9900240014",
    scores: [62, 60, 64, 58, 61, 63],
    source: "mentor_observation",
    note: "",
    daysAgo: 3,
    enteredAs: "assessor",
  },
  {
    nim: "9900250003",
    scores: [60, 66, 58, 64, 62, 63],
    source: "mentor_observation",
    note: "Perlu pendampingan terarah pada Disiplin.",
    daysAgo: 2,
    enteredAs: "assessor",
  },
  {
    nim: "9900240002",
    scores: [70, 68, 72, 66, 70, 69],
    source: "self_assessment",
    note: "",
    daysAgo: 1,
    enteredAs: "assessor",
  },
];
