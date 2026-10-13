import type { accounts } from "@/db/schema";
import { mentorStatus } from "@/ui/mentor-status";
import { isOfJurusan } from "./jurusan";

type Account = typeof accounts.$inferSelect;

/** What choosing a mentor reads of one. */
export interface MentorCandidate extends Pick<Account, "id" | "name" | "unit"> {
  /** Whether the account has the Pengasuh role and is not removed. */
  hasMentorRole: boolean;
  /** Whether the last replacement that took a group from them set them Tidak aktif. */
  leftAsInactive: boolean;
  /** Whether a replacement that waits for its start date names them as the new mentor. */
  isPromised: boolean;
  /** The angkatan of each group the mentor holds today. */
  heldCohortYears: number[];
}

function isInactive(mentor: MentorCandidate): boolean {
  const standing = {
    groupsHeld: mentor.heldCohortYears.length,
    hasMentorRole: mentor.hasMentorRole,
    leftAsInactive: mentor.leftAsInactive,
  };
  return mentorStatus(standing) === "inactive";
}

/**
 * Whether a mentor may be chosen for a group of an angkatan: one who is
 * not Tidak aktif and holds no group of another angkatan. So a mentor
 * without a group may, and so may one whose groups are all of this
 * angkatan. One who is kept for a group whose replacement waits for its
 * start date may not: that replacement could not be carried out.
 */
export function mayBeChosen(
  mentor: MentorCandidate,
  cohortYear: number,
): boolean {
  if (isInactive(mentor)) return false;
  if (mentor.isPromised) return false;
  return mentor.heldCohortYears.every((year) => year === cohortYear);
}

function byName(a: MentorCandidate, b: MentorCandidate): number {
  return a.name.localeCompare(b.name);
}

/** The mentors that may be chosen for an angkatan, by name. */
export function mentorsToChoose<M extends MentorCandidate>(
  mentors: M[],
  cohortYear: number,
): M[] {
  return mentors
    .filter((mentor) => mayBeChosen(mentor, cohortYear))
    .sort(byName);
}

/** A mentor in the choice of one group. */
export interface MentorChoice<M extends MentorCandidate> {
  mentor: M;
  /** Whether the mentor is of the jurusan of the group's program studi. */
  isSameJurusan: boolean;
}

/**
 * The choice of mentors for a group of a program studi, from the mentors
 * that may be chosen: those of the same jurusan first and marked, then
 * the others, each by name.
 */
export function choicesForProgram<M extends MentorCandidate>(
  pool: M[],
  programName: string,
): MentorChoice<M>[] {
  const choices = [...pool].sort(byName).map((mentor) => ({
    mentor,
    isSameJurusan: isOfJurusan(mentor.unit, programName),
  }));
  const same = choices.filter((choice) => choice.isSameJurusan);
  const others = choices.filter((choice) => !choice.isSameJurusan);
  return [...same, ...others];
}
