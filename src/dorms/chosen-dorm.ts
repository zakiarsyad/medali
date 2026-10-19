import { eq } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { dormResidentChoices } from "@/db/schema";
import { DORM_SEXES } from "./dorms";
import type { ChosenDorm, ResidentFacts } from "./resident-rule";

/*
 * Kept here because two areas use it: the dorm, where Pengelola Asrama
 * makes the choice, and the student data, where a change of status ends
 * it.
 */

/**
 * Where Pengelola Asrama decided by hand that one student lives, or null
 * without such a choice: what `dormOf` needs to know of it.
 */
export async function readChosenDorm(
  db: Database,
  studentId: string,
): Promise<ChosenDorm | null> {
  const [chosen] = await db
    .select({ dorm: dormResidentChoices.dorm })
    .from(dormResidentChoices)
    .where(eq(dormResidentChoices.studentId, studentId))
    .limit(1);
  return chosen ?? null;
}

/**
 * Ends the choice made by hand of where a student lives, so the usual rule
 * applies again, also once they are active again. Nothing happens for a
 * student without one. The log keeps what was chosen.
 */
export async function endChosenDorm(
  db: Database,
  studentId: string,
): Promise<void> {
  await db
    .delete(dormResidentChoices)
    .where(eq(dormResidentChoices.studentId, studentId));
}

/**
 * Ends the choice made by hand of where a student lives once it no longer
 * fits the student as saved: their status is not Aktif, or their jenis
 * kelamin is not that of the dorm chosen. A choice of "Non asrama" fits
 * any jenis kelamin. Called after every change to a student.
 */
export async function settleChosenDorm(
  db: Database,
  studentId: string,
  student: Pick<ResidentFacts, "status" | "sex">,
): Promise<void> {
  if (student.status !== "active") return endChosenDorm(db, studentId);
  const chosen = await readChosenDorm(db, studentId);
  if (chosen?.dorm == null) return;
  if (DORM_SEXES[chosen.dorm] !== student.sex) {
    await endChosenDorm(db, studentId);
  }
}
