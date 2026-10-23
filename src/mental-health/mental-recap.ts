import {
  type CountShown,
  FEWEST_COUNTED,
  shownCount,
} from "@/health-notes/shown-count";
import type { ScreeningLevel } from "./screening-ids";
import type { SessionSummary } from "./session-view";
import type { SharedData } from "./sharing-ids";

/*
 * Kesehatan mental of a group of students, as it may leave the server:
 * for the Dashboards and Dashboard asrama. Read by the screen parts, so
 * nothing here may take from the database code.
 */

/** What the database counts of the screenings of a group of students. */
export interface MentalTally {
  /** The Aktif students of the group with a screening. */
  assessed: number;
  /** How many of them are at each level by their latest screening. */
  byLevel: Record<ScreeningLevel, number>;
}

/** The anonymous count of a group, held back while it is small. */
export type MentalRecap =
  | { kind: "none" }
  | { kind: "too_few" }
  | {
      kind: "shown";
      assessed: number;
      byLevel: Record<ScreeningLevel, CountShown>;
    };

/** The anonymous count of a group with enough assessed students for counts. */
export type ShownMental = Extract<MentalRecap, { kind: "shown" }>;

/** How many students "Data kesehatan mental yang dipublikasikan" shows at most. */
export const PUBLISHED_SHOWN = 8;

/**
 * One student whose data a counsellor published to the account: only the
 * parts the student agreed to share, never the session notes.
 */
export interface PublishedRow {
  studentId: string;
  publishedAt: Date;
  name: string;
  mentorName: string | null;
  /** "Data yang dibagikan": what the student agreed to share. */
  data: SharedData[];
  /** The level of the latest screening; null when not shared or not screened. */
  level: ScreeningLevel | null;
  /** The sessions and "Tindak lanjut"; null when not shared or with no session. */
  sessions: SessionSummary | null;
  /** "Ringkasan konselor"; null when not shared. */
  summary: string | null;
}

/** How many students' counselling data is published to the account. */
export interface PublishedCounts {
  /** Every student of the group whose data is published to the account. */
  matching: number;
  /** Those of them whose sharing holds the level and whose latest is Sedang or above. */
  needCounselling: number;
}

/** What the account is given of the counselling data published to it. */
export interface PublishedMental extends PublishedCounts {
  /** The newest published, at most `PUBLISHED_SHOWN`. */
  rows: PublishedRow[];
}

/** Section 4 and its card. */
export interface MentalView {
  recap: MentalRecap;
  /** Null for an account that may read no published data. */
  published: PublishedMental | null;
}

function shownByLevel(
  byLevel: Record<ScreeningLevel, number>,
): Record<ScreeningLevel, CountShown> {
  return {
    normal: shownCount(byLevel.normal),
    mild: shownCount(byLevel.mild),
    moderate: shownCount(byLevel.moderate),
    severe: shownCount(byLevel.severe),
    extremely_severe: shownCount(byLevel.extremely_severe),
  };
}

/**
 * The counts as they may be shown: none at all while fewer than
 * `FEWEST_COUNTED` students are assessed, and "<5" for a level of 1 to
 * 4, so nobody's level can be told from them.
 */
export function mentalRecapOf(tally: MentalTally): MentalRecap {
  const { assessed, byLevel } = tally;
  if (assessed === 0) return { kind: "none" };
  if (assessed < FEWEST_COUNTED) return { kind: "too_few" };
  return { kind: "shown", assessed, byLevel: shownByLevel(byLevel) };
}
