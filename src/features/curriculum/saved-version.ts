import { versionOf } from "./ppks-activities";

/** The version of a form opened while nothing of what it shows is saved. */
export const STARTING_VERSION = "awal";

/** The version of what was last saved at `changedAt`, or never saved. */
export function savedVersion(changedAt: Date | null): string {
  if (changedAt === null) return STARTING_VERSION;
  return versionOf(changedAt);
}

/**
 * Now, or one millisecond after the last save when that one was made
 * within the same millisecond or later. A version is told by this moment,
 * so no two saves may share it. Made here, not by the database clock, so
 * it keeps to the millisecond a version shows.
 */
export function nextChangedAt(latest: Date | null): Date {
  const now = new Date();
  if (latest === null || now > latest) return now;
  return new Date(latest.getTime() + 1);
}
