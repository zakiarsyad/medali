import {
  and,
  asc,
  count,
  eq,
  gt,
  inArray,
  isNotNull,
  isNull,
  or,
  type SQL,
  sql,
} from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import type { Database } from "@/db/connect";
import {
  accounts,
  dormCleaningDuties,
  dormCleaningPlaces,
  dormRooms,
} from "@/db/schema";
import type { DormId } from "@/dorms/dorms";
import { pageWithin } from "@/ui/list-pages";
import {
  type CleaningResult,
  type CleaningStatus,
  OWN_ROOM_PAGE_SIZE,
} from "./cleaning-ids";
import type { CleaningPlace } from "./cleaning-place-list";
import type { OccupiedRoom } from "./cleaning-rooms";

/** One cleaning duty as the schedule shows it. */
export interface ScheduledDuty {
  id: string;
  /** Null for a duty of the room's own room. */
  placeId: string | null;
  /** Null once the room is removed: its number is kept. */
  roomId: string | null;
  roomNumber: string;
  /** Whether it is a "Pembersihan ulang" of a duty not met. */
  isRepeat: boolean;
  status: CleaningStatus;
  result: CleaningResult | null;
  judgeNote: string;
  judgedByName: string | null;
  judgedAt: Date | null;
  /** The reason of the last judgement sent back, empty when none was. */
  sentBackReason: string;
  validatedByName: string | null;
  validatedAt: Date | null;
}

/** One page of the rooms cleaning their own room on a date. */
export interface OwnRoomPage {
  duties: ScheduledDuty[];
  /** How many rooms clean their own room that date in all. */
  matching: number;
  page: number;
}

/**
 * A duty that was never judged: Terjadwal, and never sent back. A judged
 * one has lines in the log, which keep it.
 */
export const NEVER_JUDGED: SQL = sql`(${dormCleaningDuties.status} = 'scheduled' and ${dormCleaningDuties.sentBackReason} = '')`;

/**
 * Whether a duty shows: one of a removed place that was never judged
 * shows only on the days before the place was removed. A judged one
 * always shows, so it can still be decided and its result is seen where
 * it counts. A duty of a room's own room has no place, so it always
 * shows. The read joins the places to the duties.
 */
export const DUTY_SHOWN: SQL = sql`(${dormCleaningPlaces.removedFrom} is null or ${dormCleaningPlaces.removedFrom} > ${dormCleaningDuties.day} or not ${NEVER_JUDGED})`;

/** The join that finds the room of a duty, while the room is still there. */
export const ROOM_OF_DUTY = eq(dormRooms.id, dormCleaningDuties.roomId);

/**
 * The number of a duty's room as it is now: a room renumbered on Ploting
 * kamar shows its new number. The number kept with the duty is for a room
 * that was removed. The read joins the rooms to the duties.
 */
export const DUTY_ROOM_NUMBER = sql<string>`coalesce(${dormRooms.number}, ${dormCleaningDuties.roomNumber})`;

const judges = alias(accounts, "judges");
const validators = alias(accounts, "validators");

const DUTY = {
  id: dormCleaningDuties.id,
  placeId: dormCleaningDuties.placeId,
  roomId: dormCleaningDuties.roomId,
  roomNumber: DUTY_ROOM_NUMBER,
  isRepeat: sql<boolean>`${dormCleaningDuties.repeatOf} is not null`,
  status: dormCleaningDuties.status,
  result: dormCleaningDuties.result,
  judgeNote: dormCleaningDuties.judgeNote,
  judgedByName: judges.name,
  judgedAt: dormCleaningDuties.judgedAt,
  sentBackReason: dormCleaningDuties.sentBackReason,
  validatedByName: validators.name,
  validatedAt: dormCleaningDuties.validatedAt,
};

const JUDGE_OF_DUTY = eq(judges.id, dormCleaningDuties.judgedBy);
const VALIDATOR_OF_DUTY = eq(validators.id, dormCleaningDuties.validatedBy);

/** The join that finds the place of a duty; none for a room's own room. */
export const PLACE_OF_DUTY = eq(
  dormCleaningPlaces.id,
  dormCleaningDuties.placeId,
);

/**
 * A removed place keeps showing on a date where it has a duty that was
 * judged, so that duty has its row on the schedule.
 */
function hasJudgedDutyOn(day: string): SQL {
  return sql`exists (select 1 from ${dormCleaningDuties} where ${dormCleaningDuties.placeId} = ${dormCleaningPlaces.id} and ${dormCleaningDuties.day} = ${day} and not ${NEVER_JUDGED})`;
}

/**
 * The places of some dorms that show on a date, by dorm and by name: those
 * not removed, those removed after it, and those with a judged duty on it.
 */
export async function readPlacesOn(
  db: Database,
  dorms: readonly DormId[],
  day: string,
): Promise<CleaningPlace[]> {
  return db
    .select({
      id: dormCleaningPlaces.id,
      dorm: dormCleaningPlaces.dorm,
      name: dormCleaningPlaces.name,
    })
    .from(dormCleaningPlaces)
    .where(
      and(
        inArray(dormCleaningPlaces.dorm, [...dorms]),
        or(
          isNull(dormCleaningPlaces.removedFrom),
          gt(dormCleaningPlaces.removedFrom, day),
          hasJudgedDutyOn(day),
        ),
      ),
    )
    .orderBy(
      asc(dormCleaningPlaces.dorm),
      asc(sql`lower(${dormCleaningPlaces.name})`),
    );
}

/** The duties of the places of some dorms on a date that show. */
export async function readPlaceDutiesOn(
  db: Database,
  dorms: readonly DormId[],
  day: string,
): Promise<ScheduledDuty[]> {
  return db
    .select(DUTY)
    .from(dormCleaningDuties)
    .innerJoin(dormCleaningPlaces, PLACE_OF_DUTY)
    .leftJoin(dormRooms, ROOM_OF_DUTY)
    .leftJoin(judges, JUDGE_OF_DUTY)
    .leftJoin(validators, VALIDATOR_OF_DUTY)
    .where(
      and(
        eq(dormCleaningDuties.day, day),
        inArray(dormCleaningDuties.dorm, [...dorms]),
        DUTY_SHOWN,
      ),
    );
}

/** How many duties of some dorms show on a date: of places and of own rooms. */
export async function countDutiesOn(
  db: Database,
  dorms: readonly DormId[],
  day: string,
): Promise<number> {
  const [counted] = await db
    .select({ duties: count() })
    .from(dormCleaningDuties)
    .leftJoin(dormCleaningPlaces, PLACE_OF_DUTY)
    .where(
      and(
        eq(dormCleaningDuties.day, day),
        inArray(dormCleaningDuties.dorm, [...dorms]),
        DUTY_SHOWN,
      ),
    );
  return counted?.duties ?? 0;
}

function ownRoomsOf(dorm: DormId, day: string): SQL | undefined {
  return and(
    eq(dormCleaningDuties.day, day),
    eq(dormCleaningDuties.dorm, dorm),
    isNull(dormCleaningDuties.placeId),
  );
}

/** One page of the rooms of a dorm that clean their own room on a date, by number. */
export async function readOwnRoomPage(
  db: Database,
  dorm: DormId,
  day: string,
  page: number,
): Promise<OwnRoomPage> {
  const [counted] = await db
    .select({ matching: count() })
    .from(dormCleaningDuties)
    .where(ownRoomsOf(dorm, day));
  const matching = counted?.matching ?? 0;
  const shown = pageWithin(page, matching, OWN_ROOM_PAGE_SIZE);
  const duties = await db
    .select(DUTY)
    .from(dormCleaningDuties)
    .leftJoin(dormRooms, ROOM_OF_DUTY)
    .leftJoin(judges, JUDGE_OF_DUTY)
    .leftJoin(validators, VALIDATOR_OF_DUTY)
    .where(ownRoomsOf(dorm, day))
    .orderBy(asc(DUTY_ROOM_NUMBER), asc(dormCleaningDuties.id))
    .limit(OWN_ROOM_PAGE_SIZE)
    .offset((shown - 1) * OWN_ROOM_PAGE_SIZE);
  return { duties, matching, page: shown };
}

/**
 * How many of the rooms with residents of a dorm clean their own room on
 * a date: "(n) dari (m) kamar sudah dijadwalkan".
 */
export async function countScheduledRooms(
  db: Database,
  dorm: DormId,
  day: string,
  rooms: OccupiedRoom[],
): Promise<number> {
  if (rooms.length === 0) return 0;
  const [counted] = await db
    .select({ rooms: count() })
    .from(dormCleaningDuties)
    .where(
      and(
        ownRoomsOf(dorm, day),
        isNotNull(dormCleaningDuties.roomId),
        inArray(
          dormCleaningDuties.roomId,
          rooms.map((room) => room.id),
        ),
      ),
    );
  return counted?.rooms ?? 0;
}
