import type { GradeScheme } from "./scheme-ids";

/** Made-up weights for the checks of the character grade. */
export const FORTY_TWENTY: GradeScheme["weights"] = {
  attendance: 40,
  mentoring: 20,
  siku: 20,
  skpm: 20,
};
