import { eq } from "drizzle-orm";
import { runningPeriodOn } from "@/academic-periods/running-period";
import { readAcademicPeriods } from "@/academic-periods/stored-periods";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "./connect";
import {
  SAMPLE_SIKU_ENTRIES,
  type SampleSikuEntry,
  sampleEntryDay,
} from "./sample-siku-adjustments";
import {
  accountRoles,
  sikuAdjustmentChanges,
  sikuAdjustmentStudents,
  sikuAdjustments,
} from "./schema";
import { studentIdsByNim } from "./seed-mentor-groups";

/** The first sample account that holds a role. */
export async function sampleAccountOf(
  db: Database,
  role: RoleId,
): Promise<string> {
  const [holder] = await db
    .select({ id: accountRoles.accountId })
    .from(accountRoles)
    .where(eq(accountRoles.role, role))
    .limit(1);
  if (!holder) throw new Error(`There is no sample account with ${role}.`);
  return holder.id;
}

/** Ten in the morning on campus of a day, or now when that is later. */
export function momentOf(day: string, now: Date): Date {
  const morning = new Date(`${day}T10:00:00+07:00`);
  return morning < now ? morning : now;
}

function idOf(ids: Map<string, string>, nim: string): string {
  const id = ids.get(nim);
  if (id === undefined) {
    throw new Error(`A sample SIKU entry names the missing NIM ${nim}.`);
  }
  return id;
}

/**
 * Adds the sample SIKU entries, each in the academic period that ran on
 * its day, as the work of the sample Penilai Mahasiswa or Kepala Unit,
 * with its log lines. The sample students, accounts and periods must be
 * there already. `today` is today on campus. Gives the key each was
 * kept under.
 */
export async function addSampleSikuAdjustments(
  db: Database,
  today: string,
  now: Date = new Date(),
): Promise<Map<SampleSikuEntry, string>> {
  const added = new Map<SampleSikuEntry, string>();
  const studentIds = await studentIdsByNim(db);
  const periods = await readAcademicPeriods(db);
  const enterers = {
    assessor: await sampleAccountOf(db, "assessor"),
    head_of_unit: await sampleAccountOf(db, "head_of_unit"),
  };
  for (const sample of SAMPLE_SIKU_ENTRIES) {
    const day = sampleEntryDay(today, sample.daysAgo);
    const period = runningPeriodOn(periods, day);
    if (!period) throw new Error("A sample SIKU entry is before every period.");
    const enteredBy = enterers[sample.enteredAs];
    const enteredAt = momentOf(day, now);
    const cancelledAt =
      sample.cancelledDaysAgo === null
        ? null
        : momentOf(sampleEntryDay(today, sample.cancelledDaysAgo), now);
    const id = crypto.randomUUID();
    added.set(sample, id);
    await db.insert(sikuAdjustments).values({
      id,
      kind: sample.kind,
      reason: sample.reason,
      points: sample.points,
      day,
      note: sample.note,
      basis: sample.basis,
      periodId: period.id,
      enteredBy,
      enteredAs: sample.enteredAs,
      enteredAt,
      cancelledBy: cancelledAt === null ? null : enteredBy,
      cancelledAt,
    });
    await db.insert(sikuAdjustmentStudents).values(
      sample.nims.map((nim) => ({
        adjustmentId: id,
        studentId: idOf(studentIds, nim),
      })),
    );
    await db.insert(sikuAdjustmentChanges).values({
      adjustmentId: id,
      changedBy: enteredBy,
      changedAt: enteredAt,
      action: "entered",
    });
    if (cancelledAt === null) continue;
    await db.insert(sikuAdjustmentChanges).values({
      adjustmentId: id,
      changedBy: enteredBy,
      changedAt: cancelledAt,
      action: "cancelled",
    });
  }
  return added;
}
