import { and, asc, count, eq, sql } from "drizzle-orm";
import type { RowLimit } from "@/auth/access";
import type { Database } from "@/db/connect";
import { accounts } from "@/db/schema";
import { IS_PROMISED } from "@/mentoring/waiting-replacement";
import { shownStatus } from "./mentor-list";
import { mentorsVisibleTo } from "./visible-mentors";

/** A mentor who may take a group. The NIP is never read. */
export interface SpareMentor {
  id: string;
  name: string;
  title: string | null;
  unit: string | null;
}

/** A mentor counts as holding a group whichever program the group is of. */
const EVERY_GROUP: RowLimit = { kind: "all" };

/** A mentor the Pengasuh list shows as Cadangan to an account that sees every mentor. */
const IS_RESERVE = and(
  mentorsVisibleTo(EVERY_GROUP),
  sql`${shownStatus(EVERY_GROUP)} = 'reserve'`,
);

/**
 * A mentor who may replace another: Cadangan, and not kept already for a
 * group whose replacement waits for its start date.
 */
const IS_SPARE = and(IS_RESERVE, sql`not ${IS_PROMISED}`);

const SPARE = {
  id: accounts.id,
  name: accounts.name,
  title: accounts.title,
  unit: accounts.unit,
};

/** Every mentor who may replace another, by name. */
export function listSpareMentors(db: Database): Promise<SpareMentor[]> {
  return db
    .select(SPARE)
    .from(accounts)
    .where(IS_SPARE)
    .orderBy(asc(accounts.name), asc(accounts.id));
}

/**
 * How many mentors are Cadangan: the number the Pengasuh list gives under
 * that status, one kept for a replacement that waits among them.
 */
export async function countReserveMentors(db: Database): Promise<number> {
  const [counted] = await db
    .select({ reserve: count() })
    .from(accounts)
    .where(IS_RESERVE);
  return counted?.reserve ?? 0;
}

/** The account when it is a mentor who may replace another. Null when not. */
export async function findSpareMentor(
  db: Database,
  id: string,
): Promise<SpareMentor | null> {
  const [spare] = await db
    .select(SPARE)
    .from(accounts)
    .where(and(eq(accounts.id, id), IS_SPARE));
  return spare ?? null;
}
