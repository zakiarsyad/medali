import { and, gte, lte, ne } from "drizzle-orm";
import type { AcademicPeriod } from "@/academic-periods/academic-period";
import type { Database } from "@/db/connect";
import { academicPeriods } from "@/db/schema";
import { shownDay } from "@/ui/day";
import type { PeriodDates } from "./period-input";
import { periodTitle } from "./period-labels";

/**
 * A stored period that shares a day with the days given, if there is one.
 * The period being changed is left out by its id.
 */
export async function findOverlap(
  db: Database,
  dates: PeriodDates,
  exceptId?: string,
): Promise<AcademicPeriod | undefined> {
  const [found] = await db
    .select()
    .from(academicPeriods)
    .where(
      and(
        lte(academicPeriods.startsOn, dates.endsOn),
        gte(academicPeriods.endsOn, dates.startsOn),
        exceptId === undefined ? undefined : ne(academicPeriods.id, exceptId),
      ),
    )
    .limit(1);
  return found;
}

/** What a save answers when its days overlap another period. */
export function overlapRefusal(other: AcademicPeriod): {
  ok: false;
  error: string;
} {
  const days = `${shownDay(other.startsOn)} – ${shownDay(other.endsOn)}`;
  return {
    ok: false,
    error: `Tanggal bertumpuk dengan periode ${periodTitle(other)} (${days}). Pilih tanggal di luar periode itu.`,
  };
}
