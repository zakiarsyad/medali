import { and, count, eq, inArray, type SQL, sql } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { counsellingSharings, students } from "@/db/schema";
import { latestScreenings } from "@/features/counselling/latest-screenings";
import type { ScreeningLevel } from "@/features/counselling/screening-ids";
import { COUNSELLING_LEVELS } from "@/features/counselling/screening-rules";
import { sharedLevels } from "@/features/counselling/shared-board";
import type { SharedReader } from "./dashboard-scope";
import {
  type MentalRecap,
  type MentalView,
  mentalRecapOf,
  type PublishedMental,
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

/**
 * How many students of the group have data published to the reader, and
 * of them how many need counselling: the level is read only where the
 * sharing holds it.
 */
async function readPublished(
  db: Database,
  where: SQL,
  reader: SharedReader,
): Promise<PublishedMental> {
  const { latest, joined } = sharedLevels(db);
  const [found] = await db
    .select({
      matching: count(),
      needCounselling: sql<number>`(count(*) filter (where ${inArray(latest.level, [...COUNSELLING_LEVELS])}))::int`,
    })
    .from(counsellingSharings)
    .innerJoin(students, eq(students.id, counsellingSharings.studentId))
    .leftJoin(latest, joined)
    .where(and(reader.reach, where) ?? NOBODY);
  return {
    matching: found?.matching ?? 0,
    needCounselling: found?.needCounselling ?? 0,
  };
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
): Promise<MentalView> {
  const [recap, published] = await Promise.all([
    readRecap(db, where),
    reader === null ? null : readPublished(db, where, reader),
  ]);
  return { recap, published };
}
