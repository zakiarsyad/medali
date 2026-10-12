import { and, eq, ne } from "drizzle-orm";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import type { Database } from "@/db/connect";
import { dormRooms } from "@/db/schema";
import { brokeUniqueRule } from "@/db/unique-violation";
import type { Parsed } from "@/parsed";
import { NUMBER_RULE, numberTaken } from "./add-room";
import { readDormCohorts } from "./dorm-cohorts";
import { NOT_ALLOWED } from "./not-allowed";
import { NO_PERIOD } from "./place-resident";
import {
  NOT_FOUND,
  parseId,
  parseRoomDetails,
  type RoomDetails,
  type SentRoomDetails,
} from "./room-input";
import { countTaken, type LockedRoom, lockRoom } from "./room-lock";
import { freeStalePlacesIn } from "./stale-places";

function tooSmall(taken: number) {
  return {
    ok: false,
    error: `Kapasitas tidak boleh kurang dari jumlah orang di kamar (${taken}). Keluarkan sebagian dulu.`,
  } as const;
}

async function isNumberUsed(
  tx: Database,
  room: LockedRoom,
  number: string,
): Promise<boolean> {
  const [other] = await tx
    .select({ id: dormRooms.id })
    .from(dormRooms)
    .where(
      and(
        eq(dormRooms.dorm, room.dorm),
        eq(dormRooms.number, number),
        ne(dormRooms.id, room.id),
      ),
    )
    .limit(1);
  return other !== undefined;
}

/**
 * Writes the details in a step of its own, which alone is undone when the
 * database refuses the number: another save took it at the same moment,
 * after the look above found it free.
 */
async function writeDetails(
  tx: Database,
  room: LockedRoom,
  details: RoomDetails,
): Promise<Parsed<string>> {
  try {
    await tx.transaction((step) =>
      step.update(dormRooms).set(details).where(eq(dormRooms.id, room.id)),
    );
  } catch (error) {
    if (!brokeUniqueRule(error, NUMBER_RULE)) throw error;
    return numberTaken(room.dorm, details.number);
  }
  return { ok: true, value: details.number };
}

async function saveDetails(
  tx: Database,
  dormCohorts: number[] | null,
  roomId: string,
  details: RoomDetails,
): Promise<Parsed<string>> {
  const room = await lockRoom(tx, roomId);
  if (!room) return NOT_FOUND;
  if (details.capacity !== room.capacity) {
    if (dormCohorts === null) return NO_PERIOD;
    await freeStalePlacesIn(tx, dormCohorts, room.id);
    const taken = await countTaken(tx, room.id);
    if (details.capacity < taken) return tooSmall(taken);
  }
  if (await isNumberUsed(tx, room, details.number)) {
    return numberTaken(room.dorm, details.number);
  }
  return writeDetails(tx, room, details);
}

/**
 * Changes the number and the kapasitas of a room, and gives back its
 * number. A kapasitas below the number of residents is refused, and so is
 * a number another room of the dorm has. The residents counted are those
 * who live in the dorm on the day, today when none is given. While no
 * academic period runs they cannot be counted, so only the number can be
 * changed then.
 */
export async function changeRoom(
  db: Database,
  actor: Pick<Account, "roles">,
  sentRoomId: string,
  sent: SentRoomDetails,
  day?: string,
): Promise<Parsed<string>> {
  if (!may(actor.roles, "manage_dorm_rooms")) return NOT_ALLOWED;
  const roomId = parseId(sentRoomId);
  if (!roomId.ok) return roomId;
  const details = parseRoomDetails(sent);
  if (!details.ok) return details;
  const dormCohorts = await readDormCohorts(db, day);
  return db.transaction((tx) =>
    saveDetails(tx, dormCohorts, roomId.value, details.value),
  );
}
