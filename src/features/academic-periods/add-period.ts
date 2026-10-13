import { and, eq } from "drizzle-orm";
import { periodTitle } from "@/academic-periods/period-labels";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import type { Database } from "@/db/connect";
import { academicPeriodChanges, academicPeriods } from "@/db/schema";
import type { Parsed } from "@/parsed";
import { duplicateRefusal, refusalAfterError } from "./broken-rule";
import { NOT_ALLOWED } from "./not-allowed";
import {
  type NewPeriod,
  parseNewPeriod,
  type SentPeriod,
} from "./period-input";
import { findOverlap, overlapRefusal } from "./period-overlap";

async function alreadyExists(
  db: Database,
  period: NewPeriod,
): Promise<boolean> {
  const [found] = await db
    .select({ id: academicPeriods.id })
    .from(academicPeriods)
    .where(
      and(
        eq(academicPeriods.startYear, period.startYear),
        eq(academicPeriods.term, period.term),
      ),
    )
    .limit(1);
  return found !== undefined;
}

async function writePeriod(
  db: Database,
  by: string,
  period: NewPeriod,
): Promise<void> {
  const [added] = await db
    .insert(academicPeriods)
    .values(period)
    .returning({ id: academicPeriods.id });
  if (!added) throw new Error("The academic period was not added.");
  await db.insert(academicPeriodChanges).values({
    periodId: added.id,
    changedBy: by,
    action: "added",
    startsOnAfter: period.startsOn,
    endsOnAfter: period.endsOn,
  });
}

/**
 * Adds an academic period, and a line to the log of period changes with
 * who added it and when. Gives back the name of the period.
 */
export async function addPeriod(
  db: Database,
  actor: Pick<Account, "id" | "roles">,
  sent: SentPeriod,
): Promise<Parsed<string>> {
  if (!may(actor.roles, "set_academic_periods")) return NOT_ALLOWED;
  const parsed = parseNewPeriod(sent);
  if (!parsed.ok) return parsed;
  const period = parsed.value;

  if (await alreadyExists(db, period)) return duplicateRefusal(period);
  const overlapped = await findOverlap(db, period);
  if (overlapped) return overlapRefusal(overlapped);
  try {
    await db.transaction((tx) => writePeriod(tx, actor.id, period));
  } catch (error) {
    return refusalAfterError(db, error, period);
  }
  return { ok: true, value: periodTitle(period) };
}
