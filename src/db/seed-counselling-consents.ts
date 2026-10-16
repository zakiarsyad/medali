import { and, eq, isNull } from "drizzle-orm";
import { daysAfter } from "@/academic-periods/days-after";
import type { Database } from "./connect";
import {
  isStudentStep,
  SAMPLE_CONSENTS,
  SAMPLE_COUNSELLOR,
} from "./sample-counselling-consents";
import {
  accounts,
  counsellingConsentChanges,
  counsellingConsents,
  students,
} from "./schema";
import { momentOf } from "./seed-siku-adjustments";

interface SampleStudentIds {
  id: string;
  accountId: string;
}

async function studentOf(db: Database, nim: string): Promise<SampleStudentIds> {
  const [found] = await db
    .select({ id: students.id, accountId: accounts.id })
    .from(students)
    .innerJoin(accounts, eq(accounts.studentId, students.id))
    .where(eq(students.nim, nim));
  if (!found) {
    throw new Error(`A sample consent names the missing NIM ${nim}.`);
  }
  return found;
}

async function counsellorId(db: Database): Promise<string> {
  const [found] = await db
    .select({ id: accounts.id })
    .from(accounts)
    .where(
      and(eq(accounts.name, SAMPLE_COUNSELLOR), isNull(accounts.studentId)),
    );
  if (!found) throw new Error("The sample Konselor is missing.");
  return found.id;
}

/**
 * Adds the sample consents to counselling, each with a log line for
 * every change of it, as the work of the sample Konselor or of the
 * student. The sample students and accounts must be there already.
 * `today` is today on campus.
 */
export async function addSampleCounsellingConsents(
  db: Database,
  today: string,
  now: Date = new Date(),
): Promise<void> {
  const counsellor = await counsellorId(db);
  for (const sample of SAMPLE_CONSENTS) {
    const student = await studentOf(db, sample.nim);
    const changes = sample.steps.map((step) => ({
      step,
      by: isStudentStep(step) ? student.accountId : counsellor,
      at: momentOf(daysAfter(today, -step.daysAgo), now),
    }));
    const last = changes.at(-1);
    if (!last) throw new Error("A sample consent has no change.");
    const [consent] = await db
      .insert(counsellingConsents)
      .values({
        studentId: student.id,
        status: last.step.status,
        way: last.step.way,
        changedBy: last.by,
        changedAt: last.at,
      })
      .returning({ id: counsellingConsents.id });
    if (!consent) throw new Error("A sample consent was not added.");
    await db.insert(counsellingConsentChanges).values(
      changes.map((change, place) => ({
        consentId: consent.id,
        changedBy: change.by,
        changedAt: change.at,
        statusBefore: changes[place - 1]?.step.status ?? null,
        statusAfter: change.step.status,
        way: change.step.way,
      })),
    );
  }
}
