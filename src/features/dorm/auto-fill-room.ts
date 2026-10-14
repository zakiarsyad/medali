import { and, asc, eq, inArray, isNotNull, isNull, not } from "drizzle-orm";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import type { Database } from "@/db/connect";
import {
  dormCompanions,
  dormRoomPlaces,
  dormRooms,
  students,
} from "@/db/schema";
import { readDormCohorts } from "@/dorms/dorm-cohorts";
import type { DormId } from "@/dorms/dorms";
import { livesIn } from "@/dorms/resident-condition";
import type { Parsed } from "@/parsed";
import { NOT_ALLOWED } from "./not-allowed";
import { NO_PERIOD, ROOM_FULL } from "./place-resident";
import { NOT_FOUND, parseId } from "./room-input";
import { PLACED_AS_COMPANION, roomIn } from "./room-list";
import { countTaken, lockRoom } from "./room-lock";
import { freeStalePlacesIn, freeStalePlacesOf } from "./stale-places";

const NOBODY_WAITING = {
  ok: false,
  error: "Tidak ada penghuni yang belum diplot di asrama ini.",
} as const;

/**
 * What a fill answers when residents were waiting, but another save gave
 * every one of them a room at the same moment.
 */
const NOBODY_PLACED = {
  ok: false,
  error:
    "Tidak ada penghuni yang ditempatkan. Muat ulang halaman untuk melihat daftar terbaru.",
} as const;

/**
 * The first residents of a dorm without a room in it, in NIM order, held
 * until the transaction ends, as placing a kakak pendamping holds its
 * student. A stale place in another dorm does not count as a room. A room
 * the resident has as kakak pendamping does.
 */
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
    .leftJoin(dormRooms, roomIn(dorm))
    .where(
      and(
        livesIn(dorm, dormCohorts),
        isNull(dormRooms.id),
        not(PLACED_AS_COMPANION),
      ),
    )
    .orderBy(asc(students.nim))
    .limit(howMany)
    // Not the stronger "update": a save that writes lines pointing at two
    // of these students in another order would wait for this one while
    // this one waits for it, until the database gives one of them up.
    .for("no key update", { of: students });
  return waiting.map((resident) => resident.id);
}

/**
 * Those of some held students who are still not placed as kakak
 * pendamping. Read again once they are held: the read that found them
 * does not see a room one of them was given while it waited for them.
 */
async function withoutCompanionRoom(
  tx: Database,
  studentIds: string[],
): Promise<string[]> {
  if (studentIds.length === 0) return [];
  const placed = await tx
    .select({ studentId: dormCompanions.studentId })
    .from(dormCompanions)
    .where(
      and(
        inArray(dormCompanions.studentId, studentIds),
        isNotNull(dormCompanions.roomId),
      ),
    );
  const taken = new Set(placed.map((companion) => companion.studentId));
  return studentIds.filter((id) => !taken.has(id));
}

async function fill(
  tx: Database,
  dormCohorts: number[],
  roomId: string,
): Promise<Parsed<string>> {
  const room = await lockRoom(tx, roomId);
  if (!room) return NOT_FOUND;
  await freeStalePlacesIn(tx, dormCohorts, room.id);
  const free = room.capacity - (await countTaken(tx, room.id));
  if (free <= 0) return ROOM_FULL;
  const held = await firstWaiting(tx, room.dorm, dormCohorts, free);
  const waiting = await withoutCompanionRoom(tx, held);
  if (waiting.length === 0) return NOBODY_WAITING;
  await freeStalePlacesOf(tx, dormCohorts, waiting);

  const placed = await tx
    .insert(dormRoomPlaces)
    .values(waiting.map((studentId) => ({ roomId: room.id, studentId })))
    .onConflictDoNothing()
    .returning({ studentId: dormRoomPlaces.studentId });
  if (placed.length === 0) return NOBODY_PLACED;
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
  if (dormCohorts === null) return NO_PERIOD;
  return db.transaction((tx) => fill(tx, dormCohorts, roomId.value));
}
