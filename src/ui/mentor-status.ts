import { campusDay } from "@/academic-periods/campus-day";

/** The statuses of a mentor, in the order the list shows them. */
export const MENTOR_STATUSES = ["mentoring", "reserve", "inactive"] as const;

export type MentorStatus = (typeof MENTOR_STATUSES)[number];

export const MENTOR_STATUS_TITLES: Record<MentorStatus, string> = {
  mentoring: "Mengasuh",
  reserve: "Cadangan",
  inactive: "Tidak aktif",
};

/** Why a mentor is Tidak aktif when it is the account that says so. */
export const INACTIVE_REASON = "Akun dihapus atau peran diganti";

export interface MentorStanding {
  /** How many groups the mentor holds today. */
  groupsHeld: number;
  /** Whether the account has the Pengasuh role and is not removed. */
  hasMentorRole: boolean;
  /**
   * Whether the last replacement that took a group from the mentor set
   * them Tidak aktif.
   */
  leftAsInactive: boolean;
}

/**
 * The status of a mentor. Holding a group comes first: a mentor of today
 * is Mengasuh whatever the account says. Without a group, the one who may
 * still take one is Cadangan, and the one who may not is Tidak aktif: the
 * account lost the role, or a replacement set the mentor so.
 */
export function mentorStatus(standing: MentorStanding): MentorStatus {
  if (standing.groupsHeld > 0) return "mentoring";
  if (!standing.hasMentorRole) return "inactive";
  if (standing.leftAsInactive) return "inactive";
  return "reserve";
}

export interface MentorEnd {
  /** When the Pengasuh role was last taken from the account. */
  roleTakenAt: Date | null;
  /** When the account was removed. */
  deletedAt: Date | null;
}

/**
 * The day on campus since when a mentor is Tidak aktif: when the role was
 * taken, or else when the account was removed. Null when neither is
 * known, so that no day is made up.
 */
export function inactiveSince(end: MentorEnd): string | null {
  const at = end.roleTakenAt ?? end.deletedAt;
  return at === null ? null : campusDay(at);
}
