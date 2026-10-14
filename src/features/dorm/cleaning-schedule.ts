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
import type { Database } from "@/db/connect";
import { dormCleaningDuties, dormCleaningPlaces } from "@/db/schema";
import type { DormId } from "@/dorms/dorms";
import { pageWithin } from "@/ui/list-pages";
import { OWN_ROOM_PAGE_SIZE } from "./cleaning-ids";
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
}

/** One page of the rooms cleaning their own room on a date. */
export interface OwnRoomPage {
  duties: ScheduledDuty[];
  /** How many rooms clean their own room that date in all. */
  matching: number;
  page: number;
}

/**
 * Whether a duty shows: one of a removed place shows only on the days
 * before the place was removed. A duty of a room's own room has no place,
 * so it always shows. The read joins the places to the duties.
 */
export const DUTY_SHOWN: SQL = sql`(${dormCleaningPlaces.removedFrom} is null or ${dormCleaningPlaces.removedFrom} > ${dormCleaningDuties.day})`;

const DUTY = {
  id: dormCleaningDuties.id,
  placeId: dormCleaningDuties.placeId,
  roomId: dormCleaningDuties.roomId,
  roomNumber: dormCleaningDuties.roomNumber,
};

const PLACE_OF_DUTY = eq(dormCleaningPlaces.id, dormCleaningDuties.placeId);

/**
 * The places of some dorms that show on a date, by dorm and by name: those
 * not removed, and those removed after it.
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
    .where(ownRoomsOf(dorm, day))
    .orderBy(asc(dormCleaningDuties.roomNumber), asc(dormCleaningDuties.id))
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
