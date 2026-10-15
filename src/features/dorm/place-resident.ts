import { and, eq } from "drizzle-orm";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import type { Database } from "@/db/connect";
import { dormRoomPlaces, students } from "@/db/schema";
import { readDormCohorts } from "@/dorms/dorm-cohorts";
import { DORM_NAMES, type DormId } from "@/dorms/dorms";
import { livesIn } from "@/dorms/resident-condition";
import {
  type RoomInDorm,
  readCompanionRoom,
  roomHeader,
} from "@/dorms/student-room";
import type { Parsed } from "@/parsed";
import { NOT_ALLOWED } from "./not-allowed";
import { NOT_FOUND, parseId } from "./room-input";
import { countTaken, lockRoom } from "./room-lock";
import { freeStalePlaces } from "./stale-places";

/** What a save answers when the room has no free place left. */
export const ROOM_FULL = {
  ok: false,
  error: "Kamar sudah penuh. Pilih kamar lain.",
} as const;

/**
 * What a change answers, and the screen says, while no academic period
 * runs. No semester is known then, so who lives where cannot be told.
 */
export const NO_PERIOD = {
  ok: false,
  error:
    "Belum ada periode akademik yang berjalan, jadi penghuni belum bisa diplot. Minta Kepala Unit mengatur periode akademik.",
} as const;

const HAS_ROOM = {
  ok: false,
  error: "Penghuni ini sudah punya kamar. Keluarkan dari kamarnya dulu.",
} as const;

function notResident(dorm: DormId) {
  return {
    ok: false,
    error: `Mahasiswa ini bukan penghuni ${DORM_NAMES[dorm]}.`,
  } as const;
}

function placedAsCompanion(room: RoomInDorm) {
  return {
    ok: false,
    error: `Mahasiswa ini sudah diplot sebagai kakak pendamping di ${roomHeader(room.dorm, room)}. Keluarkan dari kamar itu dulu.`,
  } as const;
}

/** A room and a resident as a form sends them. */
export interface SentPlace {
  roomId: string;
  studentId: string;
}

async function place(
  tx: Database,
  dormCohorts: number[],
  roomId: string,
  studentId: string,
): Promise<Parsed<string>> {
  const room = await lockRoom(tx, roomId);
  if (!room) return NOT_FOUND;
  const [resident] = await tx
    .select({ name: students.name })
    .from(students)
    .where(and(eq(students.id, studentId), livesIn(room.dorm, dormCohorts)))
    // Enough to keep the other saves that give this student a room out,
    // without making a save that only points at the student wait.
    .for("no key update");
  if (!resident) return notResident(room.dorm);
  // Only once the student is held, as placing a kakak pendamping does: a
  // place this student left behind may be in this very room, and deleting
  // it first would make two placings of the student wait for each other.
  await freeStalePlaces(tx, dormCohorts, room.id, [studentId]);
  const companionRoom = await readCompanionRoom(tx, studentId);
  if (companionRoom) return placedAsCompanion(companionRoom);
  if ((await countTaken(tx, room.id)) >= room.capacity) return ROOM_FULL;

  const placed = await tx
    .insert(dormRoomPlaces)
    .values({ roomId: room.id, studentId })
    .onConflictDoNothing()
    .returning({ studentId: dormRoomPlaces.studentId });
  if (placed.length === 0) return HAS_ROOM;
  return {
    ok: true,
    value: `${resident.name} diplot ke kamar ${room.number}.`,
  };
}

/**
 * Puts a resident into a room, and gives back what to tell the staff.
 * Refused for a student who does not live in the dorm of the room, for a
 * resident who has a room, also one they have as kakak pendamping, for a
 * full room, and while no academic period runs. The room is held while its
 * places are counted, so two people filling the last place at the same
 * moment cannot both succeed. The student is held too, as placing a kakak
 * pendamping does, so nobody gets a room both ways at the same moment.
 */
export async function placeResident(
  db: Database,
  actor: Pick<Account, "roles">,
  sent: SentPlace,
  day?: string,
): Promise<Parsed<string>> {
  if (!may(actor.roles, "manage_dorm_rooms")) return NOT_ALLOWED;
  const roomId = parseId(sent.roomId);
  if (!roomId.ok) return roomId;
  const studentId = parseId(sent.studentId);
  if (!studentId.ok) return studentId;
  const dormCohorts = await readDormCohorts(db, day);
  if (dormCohorts === null) return NO_PERIOD;
  return db.transaction((tx) =>
    place(tx, dormCohorts, roomId.value, studentId.value),
  );
}
