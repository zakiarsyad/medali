import { and, count, eq, ilike, or, type SQL } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { containsPattern } from "@/db/contains-pattern";
import {
  activityClarifications,
  activitySchedules,
  students,
} from "@/db/schema";
import { pageWithin } from "@/ui/list-pages";
import type { ClarificationCard } from "./clarification-card";
import {
  CLARIFICATIONS_PAGE_SIZE,
  type ClarificationFilters,
} from "./clarification-list-address";
import {
  cardOf,
  NEWEST_SENT_FIRST,
  OF_CLARIFICATION,
  OF_KEPT_SCHEDULE,
  storedCards,
} from "./clarification-rows";

/** One page of the cards, and how many cards match the filters in all. */
export interface ClarificationList {
  cards: ClarificationCard[];
  matching: number;
  /** The page shown: the one asked for, or the last one there is. */
  page: number;
}

function ofStudentFound(query: string): SQL | undefined {
  if (query === "") return undefined;
  const pattern = containsPattern(query);
  return or(ilike(students.name, pattern), ilike(students.nim, pattern));
}

function matching(filters: ClarificationFilters): SQL | undefined {
  const { status, query } = filters;
  return and(
    OF_KEPT_SCHEDULE,
    status === "all" ? undefined : eq(activityClarifications.status, status),
    ofStudentFound(query),
  );
}

async function countCards(
  db: Database,
  condition: SQL | undefined,
): Promise<number> {
  const [counted] = await db
    .select({ matching: count() })
    .from(activityClarifications)
    .innerJoin(activitySchedules, OF_CLARIFICATION)
    .innerJoin(students, eq(students.id, activityClarifications.studentId))
    .where(condition);
  return counted?.matching ?? 0;
}

/**
 * One page of the clarification cards that match the filters, the newest
 * first, in two reads however many cards there are. Whether the account
 * may read them is checked by the caller.
 */
export async function readClarificationList(
  db: Database,
  filters: ClarificationFilters,
  page: number,
  keepsFiles: boolean,
): Promise<ClarificationList> {
  const condition = matching(filters);
  const total = await countCards(db, condition);
  const shownPage = pageWithin(page, total, CLARIFICATIONS_PAGE_SIZE);
  const rows = await storedCards(db, condition)
    .orderBy(...NEWEST_SENT_FIRST)
    .limit(CLARIFICATIONS_PAGE_SIZE)
    .offset((shownPage - 1) * CLARIFICATIONS_PAGE_SIZE);
  return {
    cards: rows.map((row) => cardOf(row, keepsFiles)),
    matching: total,
    page: shownPage,
  };
}
