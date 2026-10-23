import {
  and,
  arrayContains,
  asc,
  count,
  desc,
  eq,
  inArray,
  type SQL,
  sql,
} from "drizzle-orm";
import type { Database } from "@/db/connect";
import { counsellingSharings, students } from "@/db/schema";
import { latestScreenings } from "@/mental-health/latest-screenings";
import { logSharedReads } from "@/mental-health/log-shared-reads";
import type { ScreeningLevel } from "@/mental-health/screening-ids";
import { COUNSELLING_LEVELS } from "@/mental-health/screening-rules";
import { readSessionSummary } from "@/mental-health/session-summary";
import { sharedLevels } from "@/mental-health/shared-levels";
import { MENTOR_NAME } from "@/mentoring/mentor-name";
import type { SharedReader } from "./dashboard-scope";
import {
  type MentalRecap,
  type MentalView,
  mentalRecapOf,
  PUBLISHED_SHOWN,
  type PublishedCounts,
  type PublishedMental,
  type PublishedRow,
} from "./mental-recap";

const NOBODY = sql`false`;

/**
 * The anonymous count of the students `where` lets through, at each
 * level by their latest screening, worked out by the database, so no
 * student leaves it.
 */
async function readRecap(db: Database, where: SQL): Promise<MentalRecap> {
  const latest = latestScreenings(db, {});
  const atLevel = (level: ScreeningLevel) =>
    sql<number>`(count(*) filter (where ${eq(latest.level, level)}))::int`;
  const [tally] = await db
    .select({
      assessed: count(),
      byLevel: {
        normal: atLevel("normal"),
        mild: atLevel("mild"),
        moderate: atLevel("moderate"),
        severe: atLevel("severe"),
        extremely_severe: atLevel("extremely_severe"),
      },
    })
    .from(students)
    .innerJoin(latest, eq(latest.studentId, students.id))
    .where(where);
  if (!tally) throw new Error("Kesehatan mental was not counted.");
  return mentalRecapOf(tally);
}

/** "Ringkasan konselor", read only of a sharing that holds it. */
const SHARED_SUMMARY = sql<
  string | null
>`case when ${arrayContains(counsellingSharings.data, ["summary"])} then ${counsellingSharings.summary} end`;

/** The date of a published sharing, which the database keeps for every one. */
function publishedDate(publishedAt: Date | null): Date {
  if (publishedAt === null) throw new Error("A published sharing has no date.");
  return publishedAt;
}

/**
 * The newest published sharings the reader reaches among the students
 * `reached` lets through: only what the list shows, the level only where
 * it is shared, the summary only where it is shared, never the notes.
 */
async function readRows(tx: Database, reached: SQL) {
  const { latest, joined } = sharedLevels(tx);
  return tx
    .select({
      sharingId: counsellingSharings.id,
      studentId: students.id,
      name: students.name,
      mentorName: MENTOR_NAME,
      data: counsellingSharings.data,
      level: latest.level,
      summary: SHARED_SUMMARY,
      publishedAt: counsellingSharings.publishedAt,
    })
    .from(counsellingSharings)
    .innerJoin(students, eq(students.id, counsellingSharings.studentId))
    .leftJoin(latest, joined)
    .where(reached)
    .orderBy(
      desc(counsellingSharings.publishedAt),
      asc(students.name),
      asc(students.nim),
    )
    .limit(PUBLISHED_SHOWN);
}

type FoundRow = Awaited<ReturnType<typeof readRows>>[number];

/** A row as it is shown, with its sessions read only when they are shared. */
async function shownRow(
  tx: Database,
  row: FoundRow,
  now: Date,
): Promise<PublishedRow> {
  const sessions = row.data.includes("counselling")
    ? await readSessionSummary(tx, row.studentId, now)
    : null;
  return {
    studentId: row.studentId,
    publishedAt: publishedDate(row.publishedAt),
    name: row.name,
    mentorName: row.mentorName,
    data: row.data,
    level: row.level,
    sessions,
    summary: row.summary,
  };
}

/** How many the reader reaches, and of them how many need counselling. */
async function readNumbers(
  tx: Database,
  reached: SQL,
): Promise<PublishedCounts> {
  const { latest, joined } = sharedLevels(tx);
  const [found] = await tx
    .select({
      matching: count(),
      needCounselling: sql<number>`(count(*) filter (where ${inArray(latest.level, [...COUNSELLING_LEVELS])}))::int`,
    })
    .from(counsellingSharings)
    .innerJoin(students, eq(students.id, counsellingSharings.studentId))
    .leftJoin(latest, joined)
    .where(reached);
  return {
    matching: found?.matching ?? 0,
    needCounselling: found?.needCounselling ?? 0,
  };
}

/**
 * "Data kesehatan mental yang dipublikasikan" of the students of the
 * group: those whose sharing is published to the reader, read on each
 * load, so one withdrawn since is gone. Each row shown is written to the
 * log of readings in the same transaction.
 */
export async function readPublished(
  db: Database,
  where: SQL,
  reader: SharedReader,
  now: Date,
): Promise<PublishedMental> {
  const reached = and(reader.reach, where) ?? NOBODY;
  return db.transaction(async (tx) => {
    const numbers = await readNumbers(tx, reached);
    const found = await readRows(tx, reached);
    const rows: PublishedRow[] = [];
    for (const row of found) rows.push(await shownRow(tx, row, now));
    await logSharedReads(
      tx,
      reader.readerId,
      found.map(({ sharingId, studentId }) => ({ sharingId, studentId })),
      now,
    );
    return { rows, ...numbers };
  });
}

/**
 * Kesehatan mental of the students `where` lets through: the anonymous
 * count, and what is published to `reader`, or nothing of that for an
 * account that may read none.
 */
export async function readMental(
  db: Database,
  where: SQL,
  reader: SharedReader | null,
  now: Date = new Date(),
): Promise<MentalView> {
  const [recap, published] = await Promise.all([
    readRecap(db, where),
    reader === null ? null : readPublished(db, where, reader, now),
  ]);
  return { recap, published };
}
