import { and, count, desc, eq, ilike, or, type SQL, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { campusDay } from "@/academic-periods/campus-day";
import { shownFileOf } from "@/clarifications/shown-file";
import type { Database } from "@/db/connect";
import { containsPattern } from "@/db/contains-pattern";
import {
  accounts,
  dormActivityVersions,
  dormAttendanceCounts,
  dormClarifications,
  dormRoomPlaces,
  dormRooms,
  students,
} from "@/db/schema";
import { hourAndMinute } from "@/db/stored-time";
import { readDormCohorts } from "@/dorms/dorm-cohorts";
import type { DormId } from "@/dorms/dorms";
import { dormInSql } from "@/dorms/resident-condition";
import { shownDay, shownMoment } from "@/ui/day";
import { pageWithin } from "@/ui/list-pages";
import { hoursWords } from "./activity-words";
import {
  CLARIFICATIONS_PAGE_SIZE,
  type ClarificationFilters,
} from "./clarification-address";
import {
  byWords,
  type CheckWords,
  type DormClarificationCard,
  decisionWords,
  verificationWords,
} from "./clarification-card";
import { VERSION_OF_COUNT } from "./clarification-store";
import { REASON_WORDS } from "./clarification-words";
import { roomWords } from "./leave-list";

/** The numbers above the list: how many stand in each status. */
export interface ClarificationCounts {
  /** Menunggu verifikasi BAM. */
  submitted: number;
  /** Menunggu validasi pengelola. */
  verified: number;
  accepted: number;
  rejected: number;
}

/** One page of the cards, and how many cards match the filters in all. */
export interface ClarificationList {
  cards: DormClarificationCard[];
  matching: number;
  /** The page shown: the one asked for, or the last one there is. */
  page: number;
}

export interface ClarificationBoard {
  counts: ClarificationCounts;
  list: ClarificationList;
}

const OF_STUDENT = eq(students.id, dormClarifications.studentId);

const NONE: ClarificationCounts = {
  submitted: 0,
  verified: 0,
  accepted: 0,
  rejected: 0,
};

/** The clarifications of the visible students in each status, in one read. */
async function readCounts(
  db: Database,
  visible: SQL,
): Promise<ClarificationCounts> {
  const { status } = dormClarifications;
  const [counted] = await db
    .select({
      submitted: sql<number>`count(*) filter (where ${status} = 'submitted')::int`,
      verified: sql<number>`count(*) filter (where ${status} = 'verified')::int`,
      accepted: sql<number>`count(*) filter (where ${status} = 'accepted')::int`,
      rejected: sql<number>`count(*) filter (where ${status} = 'rejected')::int`,
    })
    .from(dormClarifications)
    .innerJoin(students, OF_STUDENT)
    .where(visible);
  return counted ?? NONE;
}

function ofStudentFound(query: string): SQL | undefined {
  if (query === "") return undefined;
  const pattern = containsPattern(query);
  return or(ilike(students.name, pattern), ilike(students.nim, pattern));
}

function matching(filters: ClarificationFilters, visible: SQL) {
  const { status, query } = filters;
  return and(
    visible,
    status === "all" ? undefined : eq(dormClarifications.status, status),
    ofStudentFound(query),
  );
}

export async function countCards(db: Database, condition: SQL | undefined) {
  const [counted] = await db
    .select({ matching: count() })
    .from(dormClarifications)
    .innerJoin(students, OF_STUDENT)
    .where(condition);
  return counted?.matching ?? 0;
}

const verifier = alias(accounts, "verifier");
const decider = alias(accounts, "decider");

/**
 * The clarifications with what their cards show: the resident and where
 * they live today, the activity as it was held, and who checked and
 * decided each. The caller says which, in what order and how many.
 */
export function selectCardRows(db: Database, dorm: SQL<DormId | null>) {
  return db
    .select({
      clarification: dormClarifications,
      name: students.name,
      nim: students.nim,
      dorm,
      room: dormRooms.number,
      day: dormAttendanceCounts.day,
      activity: dormActivityVersions.name,
      startTime: dormActivityVersions.startTime,
      endTime: dormActivityVersions.endTime,
      verifiedBy: verifier.name,
      decidedBy: decider.name,
    })
    .from(dormClarifications)
    .innerJoin(students, OF_STUDENT)
    .innerJoin(
      dormAttendanceCounts,
      eq(dormAttendanceCounts.id, dormClarifications.countId),
    )
    .innerJoin(dormActivityVersions, VERSION_OF_COUNT)
    .leftJoin(dormRoomPlaces, eq(dormRoomPlaces.studentId, students.id))
    .leftJoin(
      dormRooms,
      and(
        eq(dormRooms.id, dormRoomPlaces.roomId),
        sql`${dormRooms.dorm} = ${dorm}`,
      ),
    )
    .leftJoin(verifier, eq(verifier.id, dormClarifications.verifiedBy))
    .leftJoin(decider, eq(decider.id, dormClarifications.decidedBy));
}

function readPage(
  db: Database,
  condition: SQL | undefined,
  dorm: SQL<DormId | null>,
  page: number,
) {
  return selectCardRows(db, dorm)
    .where(condition)
    .orderBy(desc(dormClarifications.sentAt), desc(dormClarifications.id))
    .limit(CLARIFICATIONS_PAGE_SIZE)
    .offset((page - 1) * CLARIFICATIONS_PAGE_SIZE);
}

type PageRow = Awaited<ReturnType<typeof selectCardRows>>[number];

function verificationOf(row: PageRow): CheckWords | null {
  const { clarification } = row;
  const { verifiedAt, decidedAt, status, verifyNote } = clarification;
  if (verifiedAt === null) return null;
  return {
    result: verificationWords(status, decidedAt !== null, verifyNote),
    by: byWords(row.verifiedBy ?? "-", verifiedAt),
  };
}

function decisionOf(row: PageRow): CheckWords | null {
  const { decidedAt, status, acceptedAs, decisionNote } = row.clarification;
  if (decidedAt === null) return null;
  return {
    result: decisionWords(status, acceptedAs, decisionNote),
    by: byWords(row.decidedBy ?? "-", decidedAt),
  };
}

export function cardOf(
  row: PageRow,
  mayOpenFiles: boolean,
): DormClarificationCard {
  const { clarification } = row;
  const hasFile = clarification.fileKey !== null;
  const startTime = hourAndMinute(row.startTime);
  const endTime = hourAndMinute(row.endTime);
  return {
    id: clarification.id,
    sentAt: clarification.sentAt.toISOString(),
    name: row.name,
    nim: row.nim,
    room: roomWords(row.dorm, row.room),
    activity: row.activity,
    held: `${shownDay(row.day)}, ${hoursWords(startTime, endTime)}`,
    reason: REASON_WORDS[clarification.reason],
    explanation: clarification.explanation,
    status: clarification.status,
    hasFile,
    file: hasFile && mayOpenFiles ? shownFileOf(clarification) : null,
    sent: shownMoment(clarification.sentAt),
    verification: verificationOf(row),
    decision: decisionOf(row),
  };
}

/**
 * Klarifikasi kehadiran of Asrama as staff see it, among the students
 * `visible` holds: for Ketua Program Studi those of their own program
 * only. The numbers above the list, and one page of the cards that match
 * the filters, the newest first, each with where the resident lives
 * today, the activity as it was held, and who checked and decided it and
 * when. The file is named only to an account that may open it. A fixed
 * number of reads, however many clarifications there are. Whether the
 * account may read them is checked by the caller.
 */
export async function readClarificationBoard(
  db: Database,
  visible: SQL,
  filters: ClarificationFilters,
  page: number,
  options: { mayOpenFiles: boolean; now: Date },
): Promise<ClarificationBoard> {
  const condition = matching(filters, visible);
  const [counts, total, dormCohorts] = await Promise.all([
    readCounts(db, visible),
    countCards(db, condition),
    readDormCohorts(db, campusDay(options.now)),
  ]);
  const shownPage = pageWithin(page, total, CLARIFICATIONS_PAGE_SIZE);
  const dorm = dormInSql(dormCohorts ?? []);
  const rows = await readPage(db, condition, dorm, shownPage);
  return {
    counts,
    list: {
      cards: rows.map((row) => cardOf(row, options.mayOpenFiles)),
      matching: total,
      page: shownPage,
    },
  };
}
