import { and, eq, gte, inArray, isNull, not, type SQL, sql } from "drizzle-orm";
import { campusDay } from "@/academic-periods/campus-day";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import type { Database } from "@/db/connect";
import { isDay } from "@/db/is-day";
import { isUuid } from "@/db/is-uuid";
import { dormCleaningDuties, dormCleaningPlaces, dormRooms } from "@/db/schema";
import { readDormCohorts } from "@/dorms/dorm-cohorts";
import type { DormId } from "@/dorms/dorms";
import type { Parsed } from "@/parsed";
import {
  ALL_SCHEDULED,
  ASSIGN_NOT_FOUND,
  CLEANING_NOT_ALLOWED,
  DAY_PAST,
  DAY_REFUSED,
  DUTY_ASSIGNED,
  DUTY_CANCELLED,
  DUTY_NOT_FOUND,
  JUDGED_NOT_CANCELLED,
  NOT_PLOTTED,
  ownRoomsAssigned,
  PLACE_TAKEN,
  ROOM_EMPTY,
  ROOM_MISSING,
} from "./cleaning-messages";
import { parseDorm } from "./cleaning-place-input";
import { type OccupiedRoom, readOccupiedRooms } from "./cleaning-rooms";
import { lockRoom } from "./room-lock";

type Actor = Pick<Account, "id" | "roles">;

export interface SentPlaceDuty {
  placeId: string;
  roomId: string;
  day: string;
}

export interface SentOwnRooms {
  dorm: string;
  day: string;
}

const NOT_PLOTTED_REFUSAL = { ok: false, error: NOT_PLOTTED } as const;

/** A date sent for a duty: a real date, today or later. */
function parseDutyDay(sent: string, today: string): Parsed<string> {
  if (!isDay(sent)) return DAY_REFUSED;
  if (sent < today) return DAY_PAST;
  return { ok: true, value: sent };
}

/** The place, held until the change ends, while it is not removed. */
async function lockPlace(tx: Database, placeId: string) {
  const [place] = await tx
    .select({ id: dormCleaningPlaces.id, dorm: dormCleaningPlaces.dorm })
    .from(dormCleaningPlaces)
    .where(
      and(
        eq(dormCleaningPlaces.id, placeId),
        isNull(dormCleaningPlaces.deletedAt),
      ),
    )
    .for("update");
  return place ?? null;
}

/**
 * Whether a room has residents on a day, as Ploting kamar counts them.
 * While no academic period runs only Internasional and Pembibitan students
 * count.
 */
async function isOccupied(
  tx: Database,
  dorm: DormId,
  roomId: string,
  today: string,
): Promise<boolean> {
  const dormCohorts = (await readDormCohorts(tx, today)) ?? [];
  const rooms = await readOccupiedRooms(tx, dorm, dormCohorts);
  return rooms.some((room) => room.id === roomId);
}

async function savePlaceDuty(
  tx: Database,
  actor: Actor,
  sent: SentPlaceDuty,
  today: string,
): Promise<Parsed<string>> {
  const place = await lockPlace(tx, sent.placeId);
  // Held too, so a room cannot be removed while it is given a duty.
  const room = await lockRoom(tx, sent.roomId);
  if (!place || !room || room.dorm !== place.dorm) return ASSIGN_NOT_FOUND;
  if (!(await isOccupied(tx, room.dorm, room.id, today))) return ROOM_EMPTY;

  const [saved] = await tx
    .insert(dormCleaningDuties)
    .values({
      day: sent.day,
      dorm: room.dorm,
      placeId: place.id,
      roomId: room.id,
      roomNumber: room.number,
      createdBy: actor.id,
    })
    .onConflictDoNothing()
    .returning({ id: dormCleaningDuties.id });
  if (!saved) return PLACE_TAKEN;
  return { ok: true, value: DUTY_ASSIGNED };
}

/**
 * "Tugaskan": gives a place of a dorm to one of its rooms with residents
 * on a date, today or later. A place has one room a date: the database
 * keeps that, so two people giving it at once cannot both succeed.
 * `today` is the day on campus.
 */
export async function assignPlaceDuty(
  db: Database,
  actor: Actor,
  sent: SentPlaceDuty,
  today = campusDay(),
): Promise<Parsed<string>> {
  if (!may(actor.roles, "manage_dorm_cleaning")) return CLEANING_NOT_ALLOWED;
  if (sent.roomId === "") return ROOM_MISSING;
  if (!isUuid(sent.placeId) || !isUuid(sent.roomId)) return ASSIGN_NOT_FOUND;
  const day = parseDutyDay(sent.day, today);
  if (!day.ok) return day;
  const checked = { ...sent, day: day.value };
  return db.transaction((tx) => savePlaceDuty(tx, actor, checked, today));
}

/** Holds the rooms that are still there, so none is removed meanwhile. */
async function lockRooms(
  tx: Database,
  rooms: OccupiedRoom[],
): Promise<OccupiedRoom[]> {
  const ids = rooms.map((room) => room.id);
  const kept = await tx
    .select({ id: dormRooms.id })
    .from(dormRooms)
    .where(inArray(dormRooms.id, ids))
    .for("share");
  const keptIds = kept.map((room) => room.id);
  return rooms.filter((room) => keptIds.includes(room.id));
}

async function saveOwnRooms(
  tx: Database,
  actor: Actor,
  dorm: DormId,
  day: string,
  today: string,
): Promise<Parsed<string>> {
  const dormCohorts = (await readDormCohorts(tx, today)) ?? [];
  const occupied = await readOccupiedRooms(tx, dorm, dormCohorts);
  if (occupied.length === 0) return NOT_PLOTTED_REFUSAL;
  const rooms = await lockRooms(tx, occupied);
  if (rooms.length === 0) return NOT_PLOTTED_REFUSAL;

  const saved = await tx
    .insert(dormCleaningDuties)
    .values(
      rooms.map((room) => ({
        day,
        dorm,
        roomId: room.id,
        roomNumber: room.number,
        createdBy: actor.id,
      })),
    )
    .onConflictDoNothing()
    .returning({ id: dormCleaningDuties.id });
  if (saved.length === 0) return { ok: true, value: ALL_SCHEDULED };
  return { ok: true, value: ownRoomsAssigned(saved.length) };
}

/**
 * "Tugaskan semua kamar … membersihkan kamarnya sendiri": gives every room
 * of a dorm with residents a duty for its own room on a date, today or
 * later, but a room that has one that date already. `today` is the day on
 * campus.
 */
export async function assignOwnRooms(
  db: Database,
  actor: Actor,
  sent: SentOwnRooms,
  today = campusDay(),
): Promise<Parsed<string>> {
  if (!may(actor.roles, "manage_dorm_cleaning")) return CLEANING_NOT_ALLOWED;
  const dorm = parseDorm(sent.dorm);
  if (!dorm.ok) return dorm;
  const day = parseDutyDay(sent.day, today);
  if (!day.ok) return day;
  return db.transaction((tx) =>
    saveOwnRooms(tx, actor, dorm.value, day.value, today),
  );
}

/**
 * A duty that was never judged: Terjadwal, and never sent back. A judged
 * one has lines in the log, which keep it.
 */
const NEVER_JUDGED: SQL = sql`(${dormCleaningDuties.status} = 'scheduled' and ${dormCleaningDuties.sentBackReason} = '')`;

/** Whether a duty of today or later was judged, so it cannot be cancelled. */
async function isJudged(
  db: Database,
  dutyId: string,
  today: string,
): Promise<boolean> {
  const [kept] = await db
    .select({ id: dormCleaningDuties.id })
    .from(dormCleaningDuties)
    .where(
      and(
        eq(dormCleaningDuties.id, dutyId),
        gte(dormCleaningDuties.day, today),
        not(NEVER_JUDGED),
      ),
    );
  return kept !== undefined;
}

/**
 * "Batalkan tugas": removes a duty of today or later that was never
 * judged. A duty gone by stays as history, and so does a judged one.
 * `today` is the day on campus.
 */
export async function cancelDuty(
  db: Database,
  actor: Actor,
  dutyId: string,
  today = campusDay(),
): Promise<Parsed<string>> {
  if (!may(actor.roles, "manage_dorm_cleaning")) return CLEANING_NOT_ALLOWED;
  if (!isUuid(dutyId)) return DUTY_NOT_FOUND;

  const [cancelled] = await db
    .delete(dormCleaningDuties)
    .where(
      and(
        eq(dormCleaningDuties.id, dutyId),
        gte(dormCleaningDuties.day, today),
        NEVER_JUDGED,
      ),
    )
    .returning({ id: dormCleaningDuties.id });
  if (cancelled) return { ok: true, value: DUTY_CANCELLED };
  if (await isJudged(db, dutyId, today)) return JUDGED_NOT_CANCELLED;
  return DUTY_NOT_FOUND;
}

/**
 * Removes the duties of a room from a day on that were never judged, for
 * a room that is being removed. Its duties before that day and its judged
 * ones stay, with its number.
 */
export async function dropDutiesFrom(
  tx: Database,
  roomId: string,
  day: string,
): Promise<void> {
  await tx
    .delete(dormCleaningDuties)
    .where(
      and(
        eq(dormCleaningDuties.roomId, roomId),
        gte(dormCleaningDuties.day, day),
        NEVER_JUDGED,
      ),
    );
}
