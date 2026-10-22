import { eq } from "drizzle-orm";
import { campusDay } from "@/academic-periods/campus-day";
import { periodTitle } from "@/academic-periods/period-labels";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import { readClosingGrades } from "@/character-grades/closing-grades";
import { CLOSED_ONCE_RULE, keepClosing } from "@/character-grades/keep-closing";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import { semesterClosings } from "@/db/schema";
import { brokeUniqueRule } from "@/db/unique-violation";
import type { Parsed } from "@/parsed";
import { hasEnded, lockPeriod } from "./change-period-dates";

const NOT_ALLOWED = {
  ok: false,
  error: "Anda tidak berhak menutup semester.",
} as const;
const NOT_FOUND = { ok: false, error: "Periode tidak ditemukan." } as const;
const NOT_TICKED = {
  ok: false,
  error: "Centang konfirmasi terlebih dahulu.",
} as const;
const ALREADY_CLOSED = {
  ok: false,
  error: "Semester ini sudah ditutup.",
} as const;
const NOT_ENDED = {
  ok: false,
  error:
    "Semester ini belum selesai. Semester dapat ditutup setelah tanggal selesainya lewat.",
} as const;

async function isClosed(tx: Database, periodId: string): Promise<boolean> {
  const [closing] = await tx
    .select({ id: semesterClosings.id })
    .from(semesterClosings)
    .where(eq(semesterClosings.periodId, periodId));
  return closing !== undefined;
}

async function closeHeldPeriod(
  tx: Database,
  closedBy: string,
  id: string,
  today: string,
): Promise<Parsed<string>> {
  const period = await lockPeriod(tx, id);
  if (!period) return NOT_FOUND;
  if (await isClosed(tx, id)) return ALREADY_CLOSED;
  if (!hasEnded(period, today)) return NOT_ENDED;
  const { scheme, rows } = await readClosingGrades(tx, period, today);
  await keepClosing(tx, { periodId: id, closedBy, scheme, rows });
  return { ok: true, value: periodTitle(period) };
}

/**
 * Closes a period whose end has passed, once the closer has ticked that
 * its grades cannot change again: the grade of every Aktif student is
 * fixed, with the scheme in force, together with the closing, which is its
 * line in the change log. All of it is kept or none of it. Gives back
 * the name of the period.
 */
export async function closeSemester(
  db: Database,
  actor: Pick<Account, "id" | "roles">,
  id: string,
  understood: boolean,
  today: string = campusDay(),
): Promise<Parsed<string>> {
  if (!may(actor.roles, "close_semesters")) return NOT_ALLOWED;
  if (!isUuid(id)) return NOT_FOUND;
  if (!understood) return NOT_TICKED;
  try {
    return await db.transaction((tx) =>
      closeHeldPeriod(tx, actor.id, id, today),
    );
  } catch (error) {
    // The period is held while it is closed, so a second closing waits and
    // then finds the first. This is for a closing that came in some other
    // way: the database still keeps one closing per period.
    if (brokeUniqueRule(error, CLOSED_ONCE_RULE)) return ALREADY_CLOSED;
    throw error;
  }
}
