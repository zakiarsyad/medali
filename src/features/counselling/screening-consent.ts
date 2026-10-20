import { and, eq } from "drizzle-orm";
import type { AccountForAccess } from "@/auth/access";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import { students } from "@/db/schema";
import type { Parsed } from "@/parsed";
import { readConsentOf } from "./consent-reads";
import type { ConsentView } from "./consent-view";
import { STUDENT_NOT_FOUND } from "./consent-words";
import { screeningReachOf } from "./screening-reach";

/**
 * The name of a student whose screenings the account may record, or
 * null for any other id. With `tx` in a transaction, the student is
 * locked until it ends, so two saves for one student wait for each
 * other.
 */
export async function screenableStudentName(
  tx: Database,
  actor: AccountForAccess,
  studentId: unknown,
  locks = false,
): Promise<string | null> {
  const reach = screeningReachOf(actor);
  if (reach === null || !isUuid(studentId)) return null;
  const read = tx
    .select({ name: students.name })
    .from(students)
    .where(and(eq(students.id, String(studentId)), reach));
  const [found] = locks ? await read.for("no key update") : await read;
  return found?.name ?? null;
}

/**
 * The consent to counselling of the student picked in "Asesmen
 * kesehatan mental", or null when never asked. Refused for a student
 * the account may not screen; an account without the right finds none.
 */
export async function lookUpScreeningConsent(
  db: Database,
  actor: AccountForAccess,
  studentId: unknown,
): Promise<Parsed<ConsentView | null>> {
  const name = await screenableStudentName(db, actor, studentId);
  if (name === null || typeof studentId !== "string") {
    return { ok: false, error: STUDENT_NOT_FOUND };
  }
  return { ok: true, value: await readConsentOf(db, studentId) };
}
