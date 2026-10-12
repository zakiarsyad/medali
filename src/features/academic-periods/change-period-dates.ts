import { eq } from "drizzle-orm";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import { academicPeriodChanges, academicPeriods } from "@/db/schema";
import type { Parsed } from "@/parsed";
import { campusDay } from "./campus-day";
import { NOT_ALLOWED } from "./not-allowed";
import { parsePeriodDates, type SentPeriodDates } from "./period-input";
import { periodTitle } from "./period-labels";
import { findOverlap, overlapRefusal } from "./period-overlap";

const NOT_FOUND = { ok: false, error: "Periode tidak ditemukan." } as const;
const HAS_ENDED = {
  ok: false,
  error: "Periode yang sudah selesai tidak bisa diubah lagi.",
} as const;
const SAME_DAYS = {
  ok: false,
  error: "Tanggal masih sama, tidak ada yang diubah.",
} as const;

/** Whether the last day of a period is before a day. */
export function hasEnded(period: { endsOn: string }, day: string): boolean {
  return period.endsOn < day;
}

/**
 * Changes the days of a period that has not ended by today, and adds a
 * line to the log of period changes with who changed it, when, and the
 * days before and after. Gives back the name of the period.
 */
export async function changePeriodDates(
  db: Database,
  actor: Pick<Account, "id" | "roles">,
  id: string,
  sent: SentPeriodDates,
  today: string = campusDay(),
): Promise<Parsed<string>> {
  if (!may(actor.roles, "set_academic_periods")) return NOT_ALLOWED;
  if (!isUuid(id)) return NOT_FOUND;
  const parsed = parsePeriodDates(sent);
  if (!parsed.ok) return parsed;
  const dates = parsed.value;

  return db.transaction(async (tx) => {
    const [period] = await tx
      .select()
      .from(academicPeriods)
      .where(eq(academicPeriods.id, id));
    if (!period) return NOT_FOUND;
    if (hasEnded(period, today)) return HAS_ENDED;
    const isSame =
      period.startsOn === dates.startsOn && period.endsOn === dates.endsOn;
    if (isSame) return SAME_DAYS;
    const overlapped = await findOverlap(tx, dates, id);
    if (overlapped) return overlapRefusal(overlapped);

    await tx
      .update(academicPeriods)
      .set(dates)
      .where(eq(academicPeriods.id, id));
    await tx.insert(academicPeriodChanges).values({
      periodId: id,
      changedBy: actor.id,
      action: "dates_changed",
      startsOnBefore: period.startsOn,
      endsOnBefore: period.endsOn,
      startsOnAfter: dates.startsOn,
      endsOnAfter: dates.endsOn,
    });
    return { ok: true, value: periodTitle(period) };
  });
}
