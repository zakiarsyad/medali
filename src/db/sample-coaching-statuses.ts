import type { CoachingStatus } from "@/character-scores/coaching-status";

/*
 * Made-up coaching statuses only, for the made-up students.
 */

/** A sample coaching status, moved some days ago. */
export interface SampleCoachingStatus {
  nim: string;
  status: CoachingStatus;
  note: string;
  daysAgo: number;
  /** Who moved it: the sample Kepala Unit, or the sample Pengasuh for a mentee. */
  changedAs: "head_of_unit" | "mentor";
}

/**
 * The statuses of some students the latest sample assessment lists, each
 * moved after that assessment: Gita Purba to Konseling by the sample
 * Pengasuh, her mentor, Nanda Gunawan to Pemantauan and Lutfi Tarigan to
 * Selesai by the sample Kepala Unit. Citra Nasution and Fikri Wibowo have
 * none, so they show as Teridentifikasi.
 */
export const SAMPLE_COACHING_STATUSES: SampleCoachingStatus[] = [
  {
    nim: "9900250007",
    status: "counselling",
    note: "Diajak bicara tentang kehadiran apel; dijadwalkan bertemu konselor.",
    daysAgo: 5,
    changedAs: "mentor",
  },
  {
    nim: "9900240014",
    status: "monitoring",
    note: "Dipantau kehadiran kuliah selama dua minggu.",
    daysAgo: 2,
    changedAs: "head_of_unit",
  },
  {
    nim: "9900250012",
    status: "done",
    note: "Sudah mengikuti pendampingan dan menunjukkan perbaikan.",
    daysAgo: 1,
    changedAs: "head_of_unit",
  },
];
