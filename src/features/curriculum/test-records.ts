import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { academicPeriods, accounts, activitySchedules } from "@/db/schema";
import type { SentBreakdown } from "./breakdown-input";
import type { SentPpksActivity } from "./ppks-activity-input";

/** A made-up account for the checks of this area. */
export async function addTestActor(
  db: Database,
  name: string,
  roles: RoleId[],
): Promise<{ id: string; roles: RoleId[] }> {
  const [account] = await db.insert(accounts).values({ name }).returning();
  if (!account) throw new Error("The account was not added.");
  return { id: account.id, roles };
}

/**
 * A made-up odd period of that start year. The year must be one that only
 * the calling test file adds, as its first line names.
 */
export async function addTestPeriod(
  db: Database,
  startYear: number,
): Promise<string> {
  const [period] = await db
    .insert(academicPeriods)
    .values({
      startYear,
      term: "odd",
      startsOn: `${startYear}-08-01`,
      endsOn: `${startYear + 1}-01-31`,
    })
    .returning({ id: academicPeriods.id });
  if (!period) throw new Error("The period was not added.");
  return period.id;
}

/** A made-up schedule of an activity, removed when `isRemoved` is set. */
export async function addTestSchedule(
  db: Database,
  {
    activityId,
    periodId,
    actorId,
    isRemoved = false,
  }: {
    activityId: string;
    periodId: string;
    actorId: string;
    isRemoved?: boolean;
  },
): Promise<void> {
  const removed = isRemoved
    ? { deletedAt: new Date(), deletedBy: actorId }
    : {};
  await db.insert(activitySchedules).values({
    activityId,
    academicPeriodId: periodId,
    startsOn: "2026-09-10",
    endsOn: "2026-09-10",
    startTime: "07:30",
    endTime: "11:30",
    uploadCount: 1,
    uploadUnit: "day",
    location: "",
    isRequired: true,
    changedAt: new Date(),
    changedBy: actorId,
    ...removed,
  });
}

/** A PPKS activity as a form sends it, with nothing wrong in it. */
export const SENT_PPKS_ACTIVITY: SentPpksActivity = {
  semester: "3",
  name: "Kegiatan uji",
  valueKeys: ["M", "D"],
  indicatorCodes: ["M2", "D2"],
  target: "40",
  isRequired: true,
  description: "Deskripsi uji.",
};

/** The same as a special or additional activity: it sends no semester. */
export const SENT_SPECIAL_ACTIVITY: SentPpksActivity = {
  ...SENT_PPKS_ACTIVITY,
  semester: "",
};

/** The key a form made for the activity it adds. */
export const NEW_ACTIVITY_ID = "7c1d2e3f-4a5b-4c6d-8e7f-9a0b1c2d3e4f";

/** A breakdown as a form sends it, with nothing wrong in it. */
export const SENT_BREAKDOWN: SentBreakdown = {
  tahap: "2",
  valueKey: "M",
  text: "Teks uji.",
  activities: ["Kegiatan uji"],
  indicatorCodes: ["M2", "M3"],
};
