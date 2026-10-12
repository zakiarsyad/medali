import { and, eq } from "drizzle-orm";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import type { Database } from "@/db/connect";
import { academicPeriodChanges, academicPeriods } from "@/db/schema";
import type { Parsed } from "@/parsed";
import { NOT_ALLOWED } from "./not-allowed";
import {
  type NewPeriod,
  parseNewPeriod,
  type SentPeriod,
} from "./period-input";
import { periodTitle } from "./period-labels";
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
  const title = periodTitle(period);

  return db.transaction(async (tx) => {
    if (await alreadyExists(tx, period)) {
      return { ok: false, error: `Periode ${title} sudah ada.` };
    }
    const overlapped = await findOverlap(tx, period);
    if (overlapped) return overlapRefusal(overlapped);

    const [added] = await tx
      .insert(academicPeriods)
      .values(period)
      .returning({ id: academicPeriods.id });
    if (!added) throw new Error("The academic period was not added.");
    await tx.insert(academicPeriodChanges).values({
      periodId: added.id,
      changedBy: actor.id,
      action: "added",
      startsOnAfter: period.startsOn,
      endsOnAfter: period.endsOn,
    });
    return { ok: true, value: title };
  });
}
