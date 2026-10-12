import { eq } from "drizzle-orm";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import type { Database } from "@/db/connect";
import { dormRooms } from "@/db/schema";
import type { Parsed } from "@/parsed";
import { readDormCohorts } from "./dorm-cohorts";
import { NOT_ALLOWED } from "./not-allowed";
import { NO_PERIOD } from "./place-resident";
import { NOT_FOUND, parseId } from "./room-input";
import { countTaken, lockRoom } from "./room-lock";
import { freeStalePlacesIn } from "./stale-places";

function stillLivedIn(number: string) {
  return {
    ok: false,
    error: `Kamar ${number} masih berpenghuni. Keluarkan semua penghuni dulu.`,
  } as const;
}

async function removeEmpty(
  tx: Database,
  dormCohorts: number[],
  roomId: string,
): Promise<Parsed<string>> {
  const room = await lockRoom(tx, roomId);
  if (!room) return NOT_FOUND;
  await freeStalePlacesIn(tx, dormCohorts, room.id);
  if ((await countTaken(tx, room.id)) > 0) return stillLivedIn(room.number);
  await tx.delete(dormRooms).where(eq(dormRooms.id, room.id));
  return { ok: true, value: room.number };
}

/**
 * Removes a room that has no residents, and gives back its number. A room
 * with residents is refused. The residents counted are those who live in
 * the dorm on the day, today when none is given. While no academic period
 * runs they cannot be counted, so no room is removed then.
 */
export async function removeRoom(
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
  return db.transaction((tx) => removeEmpty(tx, dormCohorts, roomId.value));
}
