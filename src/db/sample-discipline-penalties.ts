import type {
  ContinuationCondition,
  PenaltyCategory,
  PenaltyLevel,
  SocialWorkForm,
  SocialWorkPlace,
} from "@/features/guidance/penalty-ids";

/*
 * Made-up discipline penalties only, for the made-up students.
 */

/** The kerja sosial of a sample penalty. */
export interface SampleSocialWork {
  forms: SocialWorkForm[];
  other: string;
  place: SocialWorkPlace;
  /** How many days after the Tanggal pelanggaran it starts. */
  startsAfter: number;
}

/** A sample penalty of one sample student. */
export interface SampleDisciplinePenalty {
  nim: string;
  /** 0 for the running semester, 1 for the one before it. */
  semester: 0 | 1;
  /**
   * In the running semester, how many days before today, or its first
   * day when that is later; in the one before, how many days after its
   * first day.
   */
  days: number;
  description: string;
  category: PenaltyCategory;
  level: PenaltyLevel;
  decisionNumber: string;
  /** Null for a Jenjang without kerja sosial. */
  socialWork: SampleSocialWork | null;
  savedAs: "discipline_officer" | "head_of_unit";
  /** The status it was followed up to; Dijatuhkan or Ditetapkan when left out. */
  movedTo?: "serving" | "served";
  /** The conditions of Syarat melanjutkan studi ticked since; none when left out. */
  conditionsMet?: ContinuationCondition[];
}

const ON_CAMPUS: SampleSocialWork = {
  forms: ["grounds"],
  other: "",
  place: "campus",
  startsAfter: 2,
};

/**
 * Penalties of this semester and the one before: Mega Saragih and
 * Nanda Gunawan of D3 Pajak, so the sample Ketua Program Studi sees
 * some; Gita Purba and Kirana Utomo, mentees of the sample Pengasuh;
 * Oki Rahayu, who has an Instansi asal, with Berat jenjang pertama and
 * kerja sosial there; and Teguh Lubis with Berat jenjang kedua,
 * Ditetapkan. Some kerja sosial is finished and some is not, and the
 * statuses are a mix: Dijatuhkan, Sedang dijalani, Selesai dijalani and
 * Ditetapkan. Oki Rahayu, suspended, has one condition of Syarat
 * melanjutkan studi ticked, so the Keputusan still waits.
 */
export const SAMPLE_DISCIPLINE_PENALTIES: SampleDisciplinePenalty[] = [
  {
    nim: "9900250013",
    semester: 0,
    days: 4,
    description:
      "Terlambat mengikuti apel pagi tiga kali dalam satu bulan setelah dua catatan pelanggaran.",
    category: "light",
    level: 1,
    decisionNumber: "",
    socialWork: { ...ON_CAMPUS, startsAfter: 1 },
    savedAs: "discipline_officer",
  },
  {
    nim: "9900240014",
    semester: 0,
    days: 15,
    description: "Menitipkan presensi kuliah kepada teman.",
    category: "medium",
    level: 2,
    decisionNumber: "KEP-014/PKN.UPK/2026",
    socialWork: {
      forms: ["staff_help", "other"],
      other: "Membantu penataan arsip perpustakaan",
      place: "campus",
      startsAfter: 3,
    },
    savedAs: "head_of_unit",
    movedTo: "serving",
  },
  {
    nim: "9900250007",
    semester: 0,
    days: 40,
    description: "Tidak mengenakan seragam sesuai ketentuan pada hari kuliah.",
    category: "light",
    level: 1,
    decisionNumber: "",
    socialWork: ON_CAMPUS,
    savedAs: "discipline_officer",
    movedTo: "served",
  },
  {
    nim: "9900240011",
    semester: 1,
    days: 50,
    description: "Merokok di area kampus yang dilarang.",
    category: "medium",
    level: 1,
    decisionNumber: "",
    socialWork: { ...ON_CAMPUS, forms: ["community"], place: "outside" },
    savedAs: "discipline_officer",
    movedTo: "served",
  },
  {
    nim: "9900240015",
    semester: 1,
    days: 30,
    description: "Memalsukan tanda tangan dosen pada daftar hadir kuliah.",
    category: "heavy",
    level: 1,
    decisionNumber: "KEP-009/PKN/2026",
    socialWork: {
      forms: ["staff_help"],
      other: "",
      place: "home_agency",
      startsAfter: 7,
    },
    savedAs: "head_of_unit",
    movedTo: "serving",
    conditionsMet: ["recommendation"],
  },
  {
    nim: "9900230018",
    semester: 0,
    days: 25,
    description:
      "Mengulangi pemalsuan dokumen akademik setelah hukuman sebelumnya.",
    category: "heavy",
    level: 2,
    decisionNumber: "KEP-021/PKN/2026",
    socialWork: null,
    savedAs: "head_of_unit",
  },
];
