import type { MarkCategory } from "@/features/dorm/mental-health-mark-ids";

/*
 * Made-up mental health early marks only, for made-up dorm residents.
 */

/** A sample mark of one sample dorm resident. */
export interface SampleMentalHealthMark {
  /**
   * Which resident it is of, by place in the same list of residents the
   * sample dorm health notes use: two of the sample Pengasuh's mentees
   * first, then the residents outside that Pengasuh's groups, by name.
   */
  resident: number;
  /** How many days before today it was set. */
  daysAgo: number;
  category: MarkCategory;
  observation: string;
  /** Who set it: the sample BAM - Kesehatan or Kepala Unit. */
  savedAs: "bam_health" | "head_of_unit";
}

/**
 * One mark of each kind: "perlu pemantauan" for a mentee of the sample
 * Pengasuh who has a health note, and "perlu dirujuk ke konselor" for a
 * resident with no health note, so no illness, who is listed only by
 * the mark.
 */
export const SAMPLE_MENTAL_HEALTH_MARKS: SampleMentalHealthMark[] = [
  {
    resident: 1,
    daysAgo: 9,
    category: "monitor",
    observation: "Sering menyendiri dan sulit tidur sejak tengah semester.",
    savedAs: "bam_health",
  },
  {
    resident: 5,
    daysAgo: 4,
    category: "refer",
    observation:
      "Menarik diri dari kegiatan asrama dan sering menangis, menurut teman sekamar.",
    savedAs: "head_of_unit",
  },
];
