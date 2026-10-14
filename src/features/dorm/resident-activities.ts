import { and, gt, gte, inArray, isNull, or, type SQL } from "drizzle-orm";
import { type CampusMoment, campusTime } from "@/academic-periods/campus-clock";
import { campusDay } from "@/academic-periods/campus-day";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import type { Database } from "@/db/connect";
import { dormActivities, dormActivityVersions } from "@/db/schema";
import type { DormId } from "@/dorms/dorms";
import { audiencesCovering } from "./activity-audience";
import {
  nextOccurrences,
  type Occurrence,
  takingPlaceOn,
} from "./activity-days";
import { readVersions } from "./activity-reads";
import type { ActivityRow } from "./activity-row";
import { readStudentDorm } from "./student-dorm";

/** How many of the next activities "Akan datang" shows. */
export const COMING_SHOWN = 6;

/** Kegiatan asrama as a resident sees it. */
export interface ResidentActivities {
  dorm: DormId;
  /** The moment on campus the states are told at. */
  now: CampusMoment;
  today: ActivityRow[];
  coming: Occurrence<ActivityRow>[];
}

export type ResidentAnswer =
  | { kind: "refused" }
  | { kind: "shown"; activities: ResidentActivities };

/** The versions that may still take place on a day or later. */
function stillFrom(day: string): SQL | undefined {
  return and(
    or(
      isNull(dormActivityVersions.shownUntil),
      gte(dormActivityVersions.shownUntil, day),
    ),
    or(
      isNull(dormActivityVersions.endsOn),
      gte(dormActivityVersions.endsOn, day),
    ),
    or(isNull(dormActivities.removedFrom), gt(dormActivities.removedFrom, day)),
  );
}

/** The activities whose Peserta covers the residents of a dorm. */
function forDorm(dorm: DormId): SQL {
  return inArray(dormActivityVersions.audience, audiencesCovering(dorm));
}

/**
 * Kegiatan asrama for a student who lives in a dorm: the activities of
 * today, and the next six after today, of those whose Peserta covers
 * their dorm. The dorm is the one they live in today, by the rule of who
 * lives in which dorm. Refused for an account without the right, and for
 * a student who lives in no dorm.
 */
export async function readResidentActivities(
  db: Database,
  account: Pick<Account, "roles" | "studentId">,
  moment: Date,
): Promise<ResidentAnswer> {
  if (!may(account.roles, "view_own_dorm_activities")) {
    return { kind: "refused" };
  }
  if (account.studentId === null) return { kind: "refused" };
  const now = { day: campusDay(moment), time: campusTime(moment) };
  const dorm = await readStudentDorm(db, account.studentId, now.day);
  if (dorm === null) return { kind: "refused" };

  const rows = await readVersions(db, and(forDorm(dorm), stillFrom(now.day)));
  return {
    kind: "shown",
    activities: {
      dorm,
      now,
      today: takingPlaceOn(rows, now.day),
      coming: nextOccurrences(rows, now.day, COMING_SHOWN),
    },
  };
}
