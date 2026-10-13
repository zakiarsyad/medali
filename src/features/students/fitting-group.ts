import { eq } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import { mentorGroups } from "@/db/schema";
import type { Parsed } from "@/parsed";
import type { StudentInput } from "./student-input";

/** What a choice is told for a group that is not there or was ended. */
export const GROUP_NOT_AVAILABLE = {
  ok: false,
  error:
    "Kelompok pengasuhan yang dipilih tidak tersedia lagi. Muat ulang halaman, lalu pilih kelompok lain.",
} as const;

/** What a choice is told for a group of other students. */
export const GROUP_DOES_NOT_FIT = {
  ok: false,
  error:
    "Kelompok pengasuhan yang dipilih bukan untuk angkatan, program studi, dan jalur mahasiswa ini. Pilih kelompok lain atau Belum ditetapkan.",
} as const;

const FITS = { ok: true, value: null } as const;

type MentorGroup = typeof mentorGroups.$inferSelect;

/** What decides whether a group may take a student. */
export type CheckedGroup = Pick<
  MentorGroup,
  "cohortYear" | "studyProgramId" | "entryPath" | "endedAt"
>;

/** What a group must share with a student to take them. */
export type StudentCohort = Pick<
  StudentInput,
  "cohortYear" | "studyProgramId" | "entryPath"
>;

/**
 * The group the form sent: an id, or null for "Belum ditetapkan". What
 * has not the shape of an id names no group that is there.
 */
export function parseGroupChoice(text: string): Parsed<string | null> {
  if (text === "") return { ok: true, value: null };
  if (!isUuid(text)) return GROUP_NOT_AVAILABLE;
  return { ok: true, value: text };
}

/**
 * Whether a group may take a student: it is in force, and of the
 * student's angkatan, program studi and jalur. A group still being
 * prepared in a penetapan is not stored as a group, so it is not found.
 */
export function checkGroupFits(
  group: CheckedGroup | undefined,
  student: StudentCohort,
): Parsed<null> {
  if (group === undefined || group.endedAt !== null) return GROUP_NOT_AVAILABLE;
  const sameCohort =
    group.cohortYear === student.cohortYear &&
    group.studyProgramId === student.studyProgramId &&
    group.entryPath === student.entryPath;
  return sameCohort ? FITS : GROUP_DOES_NOT_FIT;
}

/**
 * Checks the chosen group for a student and holds it until the save ends,
 * so a penetapan cancelled at the same moment waits and then takes the
 * new member out with the others. No group chosen needs no check.
 */
export async function holdFittingGroup(
  tx: Database,
  groupId: string | null,
  student: StudentCohort,
): Promise<Parsed<null>> {
  if (groupId === null) return FITS;
  const [group] = await tx
    .select()
    .from(mentorGroups)
    .where(eq(mentorGroups.id, groupId))
    // Not the stronger "update": a save that moves another student out of
    // this group logs a line that points at it, and two saves that swap
    // students between two groups would each wait for the other until the
    // database gives one of them up.
    .for("no key update");
  return checkGroupFits(group, student);
}
