import { asc, eq, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import type { Database } from "@/db/connect";
import {
  accounts,
  dormCleaningDuties,
  dormCleaningPlaces,
  dormRooms,
} from "@/db/schema";
import { DORM_IDS, DORM_SHORT_NAMES } from "@/dorms/dorms";
import { shownDay } from "@/ui/day";
import { ownRoomWords, roomWords } from "./cleaning-rows";
import {
  DUTY_ROOM_NUMBER,
  PLACE_OF_DUTY,
  ROOM_OF_DUTY,
} from "./cleaning-schedule";
import { countWaiting } from "./cleaning-scores";
import { type CleaningTask, TASKS_SHOWN, type TaskSection } from "./tasks-card";

const IS_JUDGED = eq(dormCleaningDuties.status, "judged");

const judges = alias(accounts, "judges");

function readJudgedDuties(db: Database) {
  return db
    .select({
      id: dormCleaningDuties.id,
      day: dormCleaningDuties.day,
      dorm: dormCleaningDuties.dorm,
      placeName: dormCleaningPlaces.name,
      roomNumber: DUTY_ROOM_NUMBER,
      isRepeat: sql<boolean>`${dormCleaningDuties.repeatOf} is not null`,
      result: dormCleaningDuties.result,
      judgeNote: dormCleaningDuties.judgeNote,
      judgedByName: judges.name,
      judgedAt: dormCleaningDuties.judgedAt,
    })
    .from(dormCleaningDuties)
    .leftJoin(dormCleaningPlaces, PLACE_OF_DUTY)
    .leftJoin(dormRooms, ROOM_OF_DUTY)
    .leftJoin(judges, eq(judges.id, dormCleaningDuties.judgedBy))
    .where(IS_JUDGED)
    .orderBy(asc(dormCleaningDuties.day), asc(dormCleaningDuties.id))
    .limit(TASKS_SHOWN);
}

type JudgedRow = Awaited<ReturnType<typeof readJudgedDuties>>[number];

export function cleaningTaskOf(row: JudgedRow): CleaningTask {
  // The database keeps a result on every judged duty.
  if (row.result === null) {
    throw new Error("A judged cleaning duty has no result.");
  }
  return {
    id: row.id,
    day: shownDay(row.day),
    place: row.placeName ?? ownRoomWords(row.roomNumber),
    room: `${DORM_SHORT_NAMES[row.dorm]} · ${roomWords(row.roomNumber)}`,
    isRepeat: row.isRepeat,
    result: row.result,
    judgeNote: row.judgeNote,
    judgedByName: row.judgedByName,
    judgedAt: row.judgedAt,
  };
}

/**
 * How many cleaning duties of every dorm BAM assessed and wait for
 * validation: "Menunggu validasi" of Pembersihan asrama.
 */
export async function countJudgedDuties(db: Database): Promise<number> {
  const counted = await countWaiting(db, DORM_IDS);
  return counted.waiting;
}

/**
 * The cleaning duties of every dorm that BAM assessed, the earliest date
 * first, with how many wait in all. Duties name rooms by number only,
 * never a student, so every dorm shows, as on Pembersihan asrama.
 */
export async function readCleaningSection(
  db: Database,
): Promise<TaskSection<CleaningTask>> {
  const [rows, total] = await Promise.all([
    readJudgedDuties(db),
    countJudgedDuties(db),
  ]);
  return { items: rows.map(cleaningTaskOf), total };
}
