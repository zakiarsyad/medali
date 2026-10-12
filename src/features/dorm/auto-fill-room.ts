import { and, asc, eq, isNull } from "drizzle-orm";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import type { Database } from "@/db/connect";
import { dormRoomPlaces, students } from "@/db/schema";
import type { Parsed } from "@/parsed";
import { readDormCohorts } from "./dorm-cohorts";
import type { DormId } from "./dorms";
import { NOT_ALLOWED } from "./not-allowed";
import { ROOM_FULL } from "./place-resident";
import { livesIn } from "./resident-condition";
import { NOT_FOUND, parseId } from "./room-input";
import { countTaken, lockRoom } from "./room-lock";
import { freeStalePlaces } from "./stale-places";

const NOBODY_WAITING = {
  ok: false,
  error: "Tidak ada penghuni yang belum diplot di asrama ini.",
} as const;

/** The first residents of a dorm without a room, in NIM order. */
async function firstWaiting(
  tx: Database,
  dorm: DormId,
  dormCohorts: number[],
  howMany: number,
): Promise<string[]> {
  const waiting = await tx
    .select({ id: students.id })
    .from(students)
    .leftJoin(dormRoomPlaces, eq(dormRoomPlaces.studentId, students.id))
    .where(and(livesIn(dorm, dormCohorts), isNull(dormRoomPlaces.studentId)))
    .orderBy(asc(students.nim))
    .limit(howMany);
  return waiting.map((resident) => resident.id);
}

async function fill(
  tx: Database,
  dormCohorts: number[],
  roomId: string,
): Promise<Parsed<string>> {
  await freeStalePlaces(tx, dormCohorts);
  const room = await lockRoom(tx, roomId);
  if (!room) return NOT_FOUND;
  const free = room.capacity - (await countTaken(tx, room.id));
  if (free <= 0) return ROOM_FULL;
  const waiting = await firstWaiting(tx, room.dorm, dormCohorts, free);
  if (waiting.length === 0) return NOBODY_WAITING;

  const placed = await tx
    .insert(dormRoomPlaces)
    .values(waiting.map((studentId) => ({ roomId: room.id, studentId })))
    .onConflictDoNothing()
    .returning({ studentId: dormRoomPlaces.studentId });
  return {
    ok: true,
    value: `${placed.length} penghuni diplot ke kamar ${room.number}.`,
  };
}

/**
 * Fills the free places of a room with residents of its dorm who have no
 * room, in NIM order, and gives back what to tell the staff.
 */
export async function autoFillRoom(
  db: Database,
  actor: Pick<Account, "roles">,
  sentRoomId: string,
  day?: string,
): Promise<Parsed<string>> {
  if (!may(actor.roles, "manage_dorm_rooms")) return NOT_ALLOWED;
  const roomId = parseId(sentRoomId);
  if (!roomId.ok) return roomId;
  const dormCohorts = await readDormCohorts(db, day);
  return db.transaction((tx) => fill(tx, dormCohorts, roomId.value));
}
