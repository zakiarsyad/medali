import { and, eq } from "drizzle-orm";
import type { Database } from "./connect";
import type { SamplePeriod } from "./sample-data";
import type { SampleResident } from "./sample-dorm-counts";
import {
  type SampleCountedViolation,
  type SampleLetter,
  type SampleReduction,
  sampleDormWarnings,
} from "./sample-dorm-warnings";
import {
  academicPeriods,
  dormViolationChanges,
  dormViolations,
  dormWarningLetterChanges,
  dormWarningLetters,
} from "./schema";
import { sampleResidents } from "./seed-dorm-counts";
import { sampleAccount } from "./seed-dorm-leaves";

const HALF_HOUR_MS = 30 * 60 * 1000;

async function periodIdOf(db: Database, period: SamplePeriod) {
  const [found] = await db
    .select({ id: academicPeriods.id })
    .from(academicPeriods)
    .where(
      and(
        eq(academicPeriods.startYear, period.startYear),
        eq(academicPeriods.term, period.term),
      ),
    );
  if (!found) throw new Error("The running sample period is missing.");
  return found.id;
}

function residentOf(residents: SampleResident[], place: number) {
  const resident = residents[place];
  if (!resident) throw new Error("A sample resident is missing.");
  return resident;
}

/** Who recorded the sample violations, and who reduced some of them. */
interface SampleActors {
  recorder: string;
  manager: string;
}

/** The mark and the log line of a reduction, or nothing for a violation that counts. */
function reductionOf(
  violationId: string,
  reduction: SampleReduction | null,
  by: string,
) {
  if (reduction === null) return { mark: {}, lines: [] };
  const line: typeof dormViolationChanges.$inferInsert = {
    violationId,
    changedBy: by,
    changedAt: reduction.at,
    action: "reduced",
    reductionReason: reduction.reason,
  };
  const mark = {
    reducedBy: by,
    reducedAt: reduction.at,
    reductionReason: reduction.reason,
  };
  return { mark, lines: [line] };
}

/**
 * Adds the violations, each recorded half an hour before its
 * announcement, and the reductions of some of them.
 */
async function addViolations(
  db: Database,
  violations: SampleCountedViolation[],
  residents: SampleResident[],
  by: SampleActors,
): Promise<void> {
  const rows: (typeof dormViolations.$inferInsert)[] = [];
  const lines: (typeof dormViolationChanges.$inferInsert)[] = [];
  for (const violation of violations) {
    const resident = residentOf(residents, violation.resident);
    const id = crypto.randomUUID();
    const enteredAt = new Date(violation.announcedAt.getTime() - HALF_HOUR_MS);
    const reduced = reductionOf(id, violation.reduction, by.manager);
    rows.push({
      id,
      batchId: crypto.randomUUID(),
      studentId: resident.id,
      dorm: resident.dorm,
      day: violation.day,
      reason: violation.reason,
      punishment: violation.punishment,
      announcedAt: violation.announcedAt,
      enteredBy: by.recorder,
      enteredAt,
      ...reduced.mark,
    });
    lines.push(
      {
        violationId: id,
        changedBy: by.recorder,
        changedAt: enteredAt,
        action: "entered",
      },
      ...reduced.lines,
    );
  }
  await db.insert(dormViolations).values(rows);
  await db.insert(dormViolationChanges).values(lines);
}

/** Adds the calls and their SPs, with a line for each call and each SP. */
async function addLetters(
  db: Database,
  letters: SampleLetter[],
  residents: SampleResident[],
  periodId: string,
  by: string,
): Promise<void> {
  const rows: (typeof dormWarningLetters.$inferInsert)[] = [];
  const lines: (typeof dormWarningLetterChanges.$inferInsert)[] = [];
  for (const { resident, level, call, issue } of letters) {
    const id = crypto.randomUUID();
    const schedule = {
      callDay: call.day,
      callTime: call.time,
      callPlace: call.place,
    };
    const issued =
      issue === null
        ? {}
        : {
            result: issue.result,
            proposalNote: issue.proposalNote,
            issuedBy: by,
            issuedAt: issue.at,
          };
    rows.push({
      id,
      studentId: residentOf(residents, resident).id,
      periodId,
      level,
      ...schedule,
      ...issued,
    });
    const line = { letterId: id, changedBy: by, ...schedule };
    lines.push({ ...line, changedAt: call.sentAt, action: "scheduled" });
    if (issue !== null) {
      lines.push({ ...line, changedAt: issue.at, action: "issued" });
    }
  }
  await db.insert(dormWarningLetters).values(rows);
  await db.insert(dormWarningLetterChanges).values(lines);
}

/**
 * Adds the sample calls and warning letters of the running sample
 * period, with the violations that led to them: recorded by the sample
 * BAM - BPHK, called, issued and reduced by the sample Pengelola Asrama.
 */
export async function addSampleDormWarnings(
  db: Database,
  period: SamplePeriod,
  now: Date = new Date(),
): Promise<void> {
  const residents = await sampleResidents(db, period);
  const { violations, letters } = sampleDormWarnings(now, period.startsOn);
  const manager = await sampleAccount(db, "dorm_manager");
  await addViolations(db, violations, residents, {
    recorder: await sampleAccount(db, "bam_bphk"),
    manager,
  });
  await addLetters(
    db,
    letters,
    residents,
    await periodIdOf(db, period),
    manager,
  );
}
