import type { SQL } from "drizzle-orm";
import { type AccountForAccess, may, rowLimitForAction } from "@/auth/access";
import { detailVisibleTo, visibleTo } from "@/auth/visible-students";
import { sharedReachOf } from "@/mental-health/shared-reach";
import { activeAmong } from "@/mentoring/active-member";
import { rolesAllowing, type SharedReader } from "./dashboard-scope";

/** Which students and records the numbers of Dashboard anak asuh count. */
export interface MenteeScope {
  /** The mentors whose groups of today are read: the account itself. */
  mentorIds: string[];
  /** The Aktif anak asuh of today. */
  mentees: SQL;
  /** The counselling data published to the account as Pengasuh, or null for none. */
  shared: SharedReader | null;
  /** The students whose notes the account may read as Pengasuh, or null for none. */
  notes: SQL | null;
  /**
   * The students whose illnesses the account may count as Pengasuh: those
   * whose health notes it reads in Penilaian jasmani, or null for none.
   */
  illnesses: SQL | null;
  /**
   * The students whose discipline penalties the account reads as Pengasuh
   * in Pembinaan > Pelanggaran disiplin, or null for none.
   */
  penalties: SQL | null;
  /** The students whose detail the account may open as Pengasuh, or null for none. */
  detail: SQL | null;
}

/** Only the notes Pengasuh reads, so another role of the account adds none. */
function notesOf(mentor: AccountForAccess): SQL | null {
  if (!may(mentor.roles, "view_mentoring_notes")) return null;
  return visibleTo(rowLimitForAction(mentor, "view_mentoring_notes"));
}

/** Only the health notes Pengasuh reads, so another role of the account adds none. */
function illnessesOf(mentor: AccountForAccess): SQL | null {
  if (!may(mentor.roles, "view_health_notes")) return null;
  return visibleTo(rowLimitForAction(mentor, "view_health_notes"));
}

/** Only the penalties Pengasuh reads, so another role of the account adds none. */
function penaltiesOf(mentor: AccountForAccess): SQL | null {
  if (!may(mentor.roles, "view_discipline_records")) return null;
  return visibleTo(rowLimitForAction(mentor, "view_discipline_records"));
}

/**
 * The account with only its roles that open Dashboard anak asuh, so the
 * detail opened from it keeps to the Pengasuh's own anak asuh too.
 */
export function menteeAccountOf(account: AccountForAccess): AccountForAccess {
  return rolesAllowing(account, "view_mentee_dashboard");
}

/**
 * The scope of Dashboard anak asuh for an account, or null for one
 * without the right to it. Only the roles that give that right count, so
 * a person who is also Kepala Unit sees here their own anak asuh alone.
 */
export function menteeScopeOf(account: AccountForAccess): MenteeScope | null {
  if (!may(account.roles, "view_mentee_dashboard")) return null;
  const limit = rowLimitForAction(account, "view_mentee_dashboard");
  if (limit.kind === "all") return null;
  const mentor = menteeAccountOf(account);
  const reach = sharedReachOf(mentor);
  return {
    mentorIds: limit.menteesOf,
    mentees: activeAmong(visibleTo(limit)),
    shared: reach === null ? null : { readerId: account.id, reach },
    notes: notesOf(mentor),
    illnesses: illnessesOf(mentor),
    penalties: penaltiesOf(mentor),
    detail: detailVisibleTo(mentor),
  };
}
