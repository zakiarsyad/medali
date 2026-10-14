import { and, count, desc, eq, gte, sql } from "drizzle-orm";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import type { Database } from "@/db/connect";
import {
  dormCleaningDuties,
  dormCleaningPlaces,
  dormRoomPlaces,
  dormRooms,
} from "@/db/schema";
import { readDormCohorts } from "@/dorms/dorm-cohorts";
import type { DormId } from "@/dorms/dorms";
import { RESIDENT_DUTIES_SHOWN } from "./cleaning-ids";
import { readOccupiedRooms } from "./cleaning-rooms";
import { DUTY_SHOWN } from "./cleaning-schedule";
import { readStudentDorm } from "./student-dorm";

/** The room of a resident as Pembersihan asrama shows it. */
export interface ResidentRoom {
  number: string;
  /** The number Ploting kamar shows for the room today. */
  residents: number;
}

/** One duty of the resident's room. */
export interface ResidentDuty {
  day: string;
  /** The place cleaned, or null for the room's own room. */
  place: string | null;
  roomNumber: string;
}

export type OwnCleaning =
  | { kind: "refused" }
  | { kind: "no_room" }
  | {
      kind: "shown";
      dorm: DormId;
      room: ResidentRoom;
      /** How many duties the room has today and later. */
      scheduled: number;
      /** The last duties of the room, newest first. */
      duties: ResidentDuty[];
    };

interface KeptRoom {
  id: string;
  number: string;
}

async function readOwnRoom(
  db: Database,
  studentId: string,
  dorm: DormId,
): Promise<KeptRoom | null> {
  const [room] = await db
    .select({ id: dormRooms.id, number: dormRooms.number })
    .from(dormRoomPlaces)
    .innerJoin(dormRooms, eq(dormRooms.id, dormRoomPlaces.roomId))
    .where(
      and(eq(dormRoomPlaces.studentId, studentId), eq(dormRooms.dorm, dorm)),
    )
    .limit(1);
  return room ?? null;
}

async function countResidents(
  db: Database,
  room: KeptRoom,
  dorm: DormId,
  today: string,
): Promise<number> {
  const dormCohorts = (await readDormCohorts(db, today)) ?? [];
  const rooms = await readOccupiedRooms(db, dorm, dormCohorts);
  return rooms.find((each) => each.id === room.id)?.residents ?? 0;
}

const PLACE_OF_DUTY = eq(dormCleaningPlaces.id, dormCleaningDuties.placeId);

async function countScheduled(
  db: Database,
  roomId: string,
  today: string,
): Promise<number> {
  const [counted] = await db
    .select({ duties: count() })
    .from(dormCleaningDuties)
    .leftJoin(dormCleaningPlaces, PLACE_OF_DUTY)
    .where(
      and(
        eq(dormCleaningDuties.roomId, roomId),
        gte(dormCleaningDuties.day, today),
        DUTY_SHOWN,
      ),
    );
  return counted?.duties ?? 0;
}

function readLastDuties(db: Database, roomId: string): Promise<ResidentDuty[]> {
  return db
    .select({
      day: dormCleaningDuties.day,
      place: dormCleaningPlaces.name,
      roomNumber: dormCleaningDuties.roomNumber,
    })
    .from(dormCleaningDuties)
    .leftJoin(dormCleaningPlaces, PLACE_OF_DUTY)
    .where(and(eq(dormCleaningDuties.roomId, roomId), DUTY_SHOWN))
    .orderBy(
      desc(dormCleaningDuties.day),
      sql`${dormCleaningPlaces.name} asc nulls last`,
    )
    .limit(RESIDENT_DUTIES_SHOWN);
}

/**
 * Pembersihan asrama for a student who lives in a dorm: the room they have
 * in it today and its duties. Only the signed-in student's own room is
 * read, so no other room can be asked for. Refused for an account without
 * the right, and for a student who lives in no dorm. `today` is the day
 * on campus.
 */
export async function readOwnCleaning(
  db: Database,
  account: Pick<Account, "roles" | "studentId">,
  today: string,
): Promise<OwnCleaning> {
  if (!may(account.roles, "view_own_dorm_cleaning")) return { kind: "refused" };
  if (account.studentId === null) return { kind: "refused" };
  const dorm = await readStudentDorm(db, account.studentId, today);
  if (dorm === null) return { kind: "refused" };
  const room = await readOwnRoom(db, account.studentId, dorm);
  if (!room) return { kind: "no_room" };

  const [residents, scheduled, duties] = await Promise.all([
    countResidents(db, room, dorm, today),
    countScheduled(db, room.id, today),
    readLastDuties(db, room.id),
  ]);
  return {
    kind: "shown",
    dorm,
    room: { number: room.number, residents },
    scheduled,
    duties,
  };
}
