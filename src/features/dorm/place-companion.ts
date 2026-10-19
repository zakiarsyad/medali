import { and, eq } from "drizzle-orm";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import { dormCompanions, students } from "@/db/schema";
import { readDormCohorts } from "@/dorms/dorm-cohorts";
import { DORM_NAMES } from "@/dorms/dorms";
import { usualDormInSql } from "@/dorms/resident-condition";
import type { Parsed } from "@/parsed";
import { hasCompanions } from "./companion-dorms";
import {
  COMPANION_NOT_FOUND,
  type LockedCompanion,
  lockCompanion,
} from "./companion-duty";
import { COMPANION_DORMS_NAMED } from "./companion-messages";
import { NOT_ALLOWED } from "./not-allowed";
import { NO_PERIOD, ROOM_FULL, type SentPlace } from "./place-resident";
import { NOT_FOUND, parseId } from "./room-input";
import { countTaken, type LockedRoom, lockRoom } from "./room-lock";
import { freeStalePlaces } from "./stale-places";

const STOPPED = {
  ok: false,
  error: "Kakak pendamping ini sudah tidak aktif. Muat ulang halaman.",
} as const;
const HAS_ROOM = {
  ok: false,
  error:
    "Kakak pendamping ini sudah punya kamar. Keluarkan dari kamarnya dulu.",
} as const;
const LIVES_WITH_COMPANIONS = {
  ok: false,
  error: `Mahasiswa ini sekarang penghuni ${COMPANION_DORMS_NAMED}, jadi diplot sebagai penghuni.`,
} as const;

function servesElsewhere(companion: LockedCompanion) {
  return {
    ok: false,
    error: `Kakak pendamping ini bertugas di ${DORM_NAMES[companion.dorm]}.`,
  } as const;
}

/** Why a kakak pendamping cannot move into a room, or null when they can. */
function refusal(
  companion: LockedCompanion,
  room: LockedRoom,
): Parsed<never> | null {
  if (!companion.isActive) return STOPPED;
  if (companion.dorm !== room.dorm) return servesElsewhere(companion);
  if (companion.roomId !== null) return HAS_ROOM;
  return null;
}

/**
 * Reads the student and holds the row until the transaction ends, as
 * placing a resident does. The student is held before the kakak
 * pendamping, in the same order everywhere.
 */
async function lockStudent(
  tx: Database,
  dormCohorts: number[],
  studentId: string,
) {
  if (!isUuid(studentId)) return null;
  const [student] = await tx
    .select({ name: students.name, usualDorm: usualDormInSql(dormCohorts) })
    .from(students)
    .where(eq(students.id, studentId))
    // Enough to keep the other saves that give this student a room out,
    // without making a save that only points at the student wait.
    .for("no key update");
  return student ?? null;
}

async function place(
  tx: Database,
  dormCohorts: number[],
  roomId: string,
  studentId: string,
): Promise<Parsed<string>> {
  const room = await lockRoom(tx, roomId);
  if (!room) return NOT_FOUND;
  const student = await lockStudent(tx, dormCohorts, studentId);
  if (!student) return COMPANION_NOT_FOUND;
  const companion = await lockCompanion(tx, studentId);
  if (!companion) return COMPANION_NOT_FOUND;
  const refused = refusal(companion, room);
  if (refused) return refused;
  // Places are deleted only once the student is held: a place this
  // student left behind may be in this very room, and deleting it first
  // would make two placings of the student wait for each other. A place
  // left behind in a dorm the student stopped living in would count
  // again, as a second room, once they live there again. That is also
  // the place of a resident of Wismantara: as an Aktif kakak pendamping
  // they live in the dorm they serve only.
  await freeStalePlaces(tx, dormCohorts, room.id, [studentId]);
  const usualDorm = student.usualDorm;
  if (usualDorm !== null && hasCompanions(usualDorm)) {
    return LIVES_WITH_COMPANIONS;
  }
  if ((await countTaken(tx, room.id)) >= room.capacity) return ROOM_FULL;

  await tx
    .update(dormCompanions)
    .set({ roomId: room.id })
    .where(eq(dormCompanions.studentId, companion.studentId));
  return {
    ok: true,
    value: `${student.name} diplot ke kamar ${room.number}.`,
  };
}

/**
 * Puts an active kakak pendamping into a room of the dorm they serve, and
 * gives back what to tell the staff. They take one place of the kapasitas.
 * The room and the kakak pendamping are both held, so the last place is
 * not given twice, and placing never wins together with "Nonaktifkan".
 */
export async function placeCompanion(
  db: Database,
  actor: Pick<Account, "roles">,
  sent: SentPlace,
  day?: string,
): Promise<Parsed<string>> {
  if (!may(actor.roles, "manage_dorm_rooms")) return NOT_ALLOWED;
  const roomId = parseId(sent.roomId);
  if (!roomId.ok) return roomId;
  const dormCohorts = await readDormCohorts(db, day);
  if (dormCohorts === null) return NO_PERIOD;
  return db.transaction((tx) =>
    place(tx, dormCohorts, roomId.value, sent.studentId),
  );
}

/**
 * Takes a kakak pendamping out of their room. Their duty goes on, without
 * a room. Refused when they are not in that room.
 */
export async function takeOutCompanion(
  db: Database,
  actor: Pick<Account, "roles">,
  sent: SentPlace,
): Promise<Parsed<string>> {
  if (!may(actor.roles, "manage_dorm_rooms")) return NOT_ALLOWED;
  const roomId = parseId(sent.roomId);
  if (!roomId.ok) return roomId;
  const studentId = parseId(sent.studentId);
  if (!studentId.ok) return studentId;

  const freed = await db
    .update(dormCompanions)
    .set({ roomId: null })
    .where(
      and(
        eq(dormCompanions.roomId, roomId.value),
        eq(dormCompanions.studentId, studentId.value),
      ),
    )
    .returning({ studentId: dormCompanions.studentId });
  if (freed.length === 0) return NOT_FOUND;
  return { ok: true, value: "Kakak pendamping dikeluarkan dari kamar." };
}
