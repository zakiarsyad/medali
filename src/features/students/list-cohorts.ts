import type { SQL } from "drizzle-orm";
import type { StageCohorts } from "@/academic-periods/stage-cohorts";

/**
 * What the filters of the list read that is looked up before the list:
 * which angkatan is where now, and who the score filters let through.
 */
export interface ListCohorts {
  /**
   * The students the predikat and grade choices let through, or nothing
   * while neither is chosen. Worked out first, because the grade reads
   * its scheme and parts before it can be asked.
   */
  scored?: SQL | undefined;
  /** The angkatan years in each tahap, for the Tahapan filter. */
  stages: StageCohorts;
  /**
   * The angkatan years in a semester that lives in the dorm, for the
   * Asrama filter and tag. None while no academic period runs.
   */
  dorms: number[];
}
