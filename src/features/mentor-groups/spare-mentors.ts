import { and, asc, eq, sql } from "drizzle-orm";
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

/**
 * A mentor who may replace another: Cadangan, and not kept already for a
 * group whose replacement waits for its start date.
 */
const IS_SPARE = and(
  mentorsVisibleTo(EVERY_GROUP),
  sql`${shownStatus(EVERY_GROUP)} = 'reserve'`,
  sql`not ${IS_PROMISED}`,
);

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
