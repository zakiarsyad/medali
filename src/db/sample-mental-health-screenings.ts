import type {
  Instrument,
  ScreeningLevel,
} from "@/features/counselling/screening-ids";

/*
 * Made-up mental health screenings only, for made-up students, each
 * recorded by the sample Konselor while the student's consent to
 * counselling was Disetujui.
 */

/** A sample screening of one sample student, some days ago. */
export interface SampleScreening {
  nim: string;
  daysAgo: number;
  instrument: Instrument;
  /** The DASS-21 sums; none for SRQ-20. */
  depression: number | null;
  anxiety: number | null;
  stress: number | null;
  /** The SRQ-20 number of "ya"; none for DASS-21. */
  srqYes: number | null;
  selfHarm: boolean;
  /** The level the rules give these scores. */
  level: ScreeningLevel;
  note: string;
}

function dass(
  sums: [number, number, number],
): Pick<SampleScreening, "depression" | "anxiety" | "stress" | "srqYes"> {
  const [depression, anxiety, stress] = sums;
  return { depression, anxiety, stress, srqYes: null };
}

function srq(
  srqYes: number,
): Pick<SampleScreening, "depression" | "anxiety" | "stress" | "srqYes"> {
  return { depression: null, anxiety: null, stress: null, srqYes };
}

/**
 * Both instruments and every level: Bayu Santoso twice, Ringan and then
 * Berat, so "Rincian" shows a history and the latest counts. Hadi
 * Kurniawan ticked self-harm, so Sangat berat and "Risiko". Intan
 * Harahap was screened before she withdrew her consent, and now waits
 * for it again.
 */
export const SAMPLE_SCREENINGS: SampleScreening[] = [
  {
    nim: "9900240002",
    daysAgo: 10,
    instrument: "dass21",
    ...dass([6, 3, 8]),
    selfHarm: false,
    level: "mild",
    note: "Cemas menjelang ujian tengah semester.",
  },
  {
    nim: "9900240002",
    daysAgo: 3,
    instrument: "dass21",
    ...dass([11, 5, 10]),
    selfHarm: false,
    level: "severe",
    note: "Suasana hati menurun sejak masalah keluarga. Sesi lanjutan minggu depan.",
  },
  {
    nim: "9900250003",
    daysAgo: 12,
    instrument: "srq20",
    ...srq(7),
    selfHarm: false,
    level: "moderate",
    note: "Sering pusing dan sulit tidur.",
  },
  {
    nim: "9900240004",
    daysAgo: 4,
    instrument: "srq20",
    ...srq(3),
    selfHarm: false,
    level: "normal",
    note: "",
  },
  {
    nim: "9900240008",
    daysAgo: 2,
    instrument: "dass21",
    ...dass([9, 7, 12]),
    selfHarm: true,
    level: "extremely_severe",
    note: "Didampingi tim krisis kampus pada hari yang sama.",
  },
  {
    nim: "9900250009",
    daysAgo: 30,
    instrument: "dass21",
    ...dass([8, 6, 9]),
    selfHarm: false,
    level: "moderate",
    note: "Kesulitan menyesuaikan diri dengan kegiatan asrama.",
  },
];
