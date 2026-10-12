import { and, eq } from "drizzle-orm";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import type { Database } from "@/db/connect";
import { dormRoomPlaces, students } from "@/db/schema";
import type { Parsed } from "@/parsed";
import { readDormCohorts } from "./dorm-cohorts";
import { DORM_NAMES, type DormId } from "./dorms";
import { NOT_ALLOWED } from "./not-allowed";
import { livesIn } from "./resident-condition";
import { NOT_FOUND, parseId } from "./room-input";
import { countTaken, lockRoom } from "./room-lock";
import { freeStalePlaces } from "./stale-places";

/** What a save answers when the room has no free place left. */
export const ROOM_FULL = {
  ok: false,
  error: "Kamar sudah penuh. Pilih kamar lain.",
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
  await freeStalePlaces(tx, dormCohorts);
  const room = await lockRoom(tx, roomId);
  if (!room) return NOT_FOUND;
  const [resident] = await tx
    .select({ name: students.name })
    .from(students)
    .where(and(eq(students.id, studentId), livesIn(room.dorm, dormCohorts)))
    .limit(1);
  if (!resident) return notResident(room.dorm);
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
 * resident who has a room, and for a full room. The room is held while its
 * places are counted, so two people filling the last place at the same
 * moment cannot both succeed.
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
  return db.transaction((tx) =>
    place(tx, dormCohorts, roomId.value, studentId.value),
  );
}
