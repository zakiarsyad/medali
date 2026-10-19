import { eq } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { dormResidentChoices } from "@/db/schema";
import type { ChosenDorm } from "./resident-rule";

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
