import { FEWEST_COUNTED } from "@/health-notes/shown-count";

/*
 * Kesehatan mental of the Dashboard, as it may leave the server. Read by
 * the screen parts, so nothing here may take from the database code.
 */

/** What the database counts of the screenings of the students of the Dashboard. */
export interface MentalTally {
  /** The Aktif students of the group with a screening. */
  assessed: number;
}

/** The anonymous count of a group, held back while it is small. */
export type MentalRecap =
  | { kind: "none" }
  | { kind: "too_few" }
  | { kind: "shown"; assessed: number };

/** What the account is given of the counselling data published to it. */
export interface PublishedMental {
  /** Every student of the group whose data is published to the account. */
  matching: number;
  /** Those of them whose sharing holds the level and whose latest is Sedang or above. */
  needCounselling: number;
}

/** Section 4 and its card. */
export interface MentalView {
  recap: MentalRecap;
  /** Null for an account that may read no published data. */
  published: PublishedMental | null;
}

/**
 * The count as it may be shown: none at all while fewer than
 * `FEWEST_COUNTED` students are assessed, so nobody's level can be told
 * from it.
 */
export function mentalRecapOf(tally: MentalTally): MentalRecap {
  const { assessed } = tally;
  if (assessed === 0) return { kind: "none" };
  if (assessed < FEWEST_COUNTED) return { kind: "too_few" };
  return { kind: "shown", assessed };
}
