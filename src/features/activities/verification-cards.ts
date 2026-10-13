import { and, asc, count, eq, isNotNull, isNull, type SQL } from "drizzle-orm";
import type { Database } from "@/db/connect";
import {
  accounts,
  activityAttendances,
  activitySchedules,
  ppksActivities,
  students,
  studyPrograms,
} from "@/db/schema";
import { pageWithin } from "@/ui/list-pages";
import { isOutsideDates } from "./outside-dates";
import {
  CARDS_PAGE_SIZE,
  type VerificationFilters,
} from "./verification-address";
import { sentTimeWords, type VerificationCard } from "./verification-card";

/** One page of the cards, and how many cards match the filters in all. */
export interface CardList {
  cards: VerificationCard[];
  matching: number;
  /** The page shown: the one asked for, or the last one there is. */
  page: number;
}

export const OF_ATTENDANCE = eq(
  activitySchedules.id,
  activityAttendances.scheduleId,
);

/**
 * What makes an attendance a card: a photo was sent for it, and its
 * schedule is not removed. A record made by hand has no time sent.
 */
export const IS_CARD = and(
  isNotNull(activityAttendances.sentAt),
  isNull(activitySchedules.deletedAt),
);

function matching(filters: VerificationFilters): SQL | undefined {
  const { scheduleId, status } = filters;
  return and(
    IS_CARD,
    scheduleId === null
      ? undefined
      : eq(activityAttendances.scheduleId, scheduleId),
    status === "all" ? undefined : eq(activityAttendances.status, status),
  );
}

const CARD = {
  id: activityAttendances.id,
  status: activityAttendances.status,
  note: activityAttendances.note,
  sentAt: activityAttendances.sentAt,
  photoKey: activityAttendances.photoKey,
  name: students.name,
  nim: students.nim,
  program: studyPrograms.name,
  activity: ppksActivities.name,
  startsOn: activitySchedules.startsOn,
  endsOn: activitySchedules.endsOn,
  decidedBy: accounts.name,
};

/** The stored cards that match, with everything a card shows. */
export function storedCards(db: Database, condition: SQL | undefined) {
  return db
    .select(CARD)
    .from(activityAttendances)
    .innerJoin(activitySchedules, OF_ATTENDANCE)
    .innerJoin(
      ppksActivities,
      eq(ppksActivities.id, activitySchedules.activityId),
    )
    .innerJoin(students, eq(students.id, activityAttendances.studentId))
    .innerJoin(studyPrograms, eq(studyPrograms.id, students.studyProgramId))
    .leftJoin(accounts, eq(accounts.id, activityAttendances.decidedBy))
    .where(condition);
}

type StoredCard = Awaited<ReturnType<typeof storedCards>>[number];

/**
 * A stored attendance as its card. `keepsPhotos` is whether this place
 * has a file storage: without one no picture can be shown.
 */
export function cardOf(
  stored: StoredCard,
  keepsPhotos: boolean,
): VerificationCard {
  const { sentAt, photoKey, startsOn, endsOn, ...card } = stored;
  // The read asks only for attendances with a time sent.
  if (sentAt === null) {
    throw new Error(`The attendance ${stored.id} has no time sent.`);
  }
  return {
    ...card,
    sentAt: sentAt.toISOString(),
    sent: sentTimeWords(sentAt),
    isOutsideDates: isOutsideDates(sentAt, { startsOn, endsOn }),
    hasPhoto: keepsPhotos && photoKey !== null,
  };
}

async function countCards(
  db: Database,
  condition: SQL | undefined,
): Promise<number> {
  const [counted] = await db
    .select({ matching: count() })
    .from(activityAttendances)
    .innerJoin(activitySchedules, OF_ATTENDANCE)
    .where(condition);
  return counted?.matching ?? 0;
}

/**
 * One page of the photo cards that match the filters, the oldest first.
 * Two sent at the same moment keep one order on every page.
 */
export async function readCards(
  db: Database,
  filters: VerificationFilters,
  page: number,
  keepsPhotos: boolean,
): Promise<CardList> {
  const condition = matching(filters);
  const total = await countCards(db, condition);
  const shownPage = pageWithin(page, total, CARDS_PAGE_SIZE);
  const rows = await storedCards(db, condition)
    .orderBy(asc(activityAttendances.sentAt), asc(activityAttendances.id))
    .limit(CARDS_PAGE_SIZE)
    .offset((shownPage - 1) * CARDS_PAGE_SIZE);
  return {
    cards: rows.map((row) => cardOf(row, keepsPhotos)),
    matching: total,
    page: shownPage,
  };
}
