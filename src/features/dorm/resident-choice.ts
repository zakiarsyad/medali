import { eq, sql } from "drizzle-orm";
import type { Database } from "@/db/connect";
import {
  dormCompanions,
  dormResidentChoiceChanges,
  dormResidentChoices,
  students,
} from "@/db/schema";
import { WRITTEN_NOW } from "@/db/written-now";
import type { DormId } from "@/dorms/dorms";
import { dormInSql } from "@/dorms/resident-condition";

/** A student as a choice made by hand needs to know them. */
export interface HeldStudent {
  name: string;
  sex: (typeof students.$inferSelect)["sex"];
  /** Active and not removed. */
  isActive: boolean;
  /** The dorm they live in now, null for "Non asrama". */
  dorm: DormId | null;
  /** Whether they are an Aktif kakak pendamping. */
  isCompanion: boolean;
}

const IS_COMPANION = sql<boolean>`exists (
  select 1 from ${dormCompanions}
  where ${dormCompanions.studentId} = ${students.id}
    and ${dormCompanions.isActive}
)`;

/**
 * Holds a student until the transaction ends, as placing them in a room
 * does, then reads them. So two choices made by hand for the same student
 * never run at the same moment: the second waits, and then reads what the
 * first one saved. The read comes after the hold, in a statement of its
 * own: one read with the hold would not see a choice saved while it
 * waited. Null for a student who is not found.
 */
export async function holdStudent(
  tx: Database,
  dormCohorts: number[],
  studentId: string,
): Promise<HeldStudent | null> {
  const [held] = await tx
    .select({ id: students.id })
    .from(students)
    .where(eq(students.id, studentId))
    .for("no key update");
  if (!held) return null;
  const [student] = await tx
    .select({
      name: students.name,
      sex: students.sex,
      status: students.status,
      deletedAt: students.deletedAt,
      dorm: dormInSql(dormCohorts),
      isCompanion: IS_COMPANION,
    })
    .from(students)
    .where(eq(students.id, studentId));
  if (!student) return null;
  const { status, deletedAt, ...rest } = student;
  return { ...rest, isActive: status === "active" && deletedAt === null };
}

/** Where a student lived, and where a choice made by hand puts them. */
export interface DormChange {
  studentId: string;
  before: DormId | null;
  /** The dorm chosen, null for "Non asrama". */
  after: DormId | null;
  note: string | null;
}

/**
 * Keeps the choice made by hand of where a student lives, in place of the
 * one they had, and writes it in the log with who made it and when.
 */
export async function saveChosenDorm(
  tx: Database,
  by: string,
  change: DormChange,
): Promise<void> {
  const chosen = {
    dorm: change.after,
    note: change.note,
    setBy: by,
    setAt: WRITTEN_NOW,
  };
  await tx
    .insert(dormResidentChoices)
    .values({ studentId: change.studentId, ...chosen })
    .onConflictDoUpdate({ target: dormResidentChoices.studentId, set: chosen });
  await tx.insert(dormResidentChoiceChanges).values({
    studentId: change.studentId,
    dormBefore: change.before,
    dormAfter: change.after,
    changedBy: by,
    changedAt: WRITTEN_NOW,
  });
}
