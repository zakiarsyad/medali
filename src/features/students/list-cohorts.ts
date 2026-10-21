import type { StageCohorts } from "@/academic-periods/stage-cohorts";

/** Which angkatan is where now, for the filters of the list that read it. */
export interface ListCohorts {
  /** The angkatan years in each tahap, for the Tahapan filter. */
  stages: StageCohorts;
  /**
   * The angkatan years in a semester that lives in the dorm, for the
   * Asrama filter and tag. None while no academic period runs.
   */
  dorms: number[];
}
