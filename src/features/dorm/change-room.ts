import { and, eq, ne } from "drizzle-orm";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import type { Database } from "@/db/connect";
import { dormRooms } from "@/db/schema";
import type { Parsed } from "@/parsed";
import { numberTaken } from "./add-room";
import { NOT_ALLOWED } from "./not-allowed";
import {
  NOT_FOUND,
  parseId,
  parseRoomDetails,
  type RoomDetails,
  type SentRoomDetails,
} from "./room-input";
import { countTaken, type LockedRoom, lockRoom } from "./room-lock";

function tooSmall(taken: number) {
  return {
    ok: false,
    error: `Kapasitas tidak boleh kurang dari jumlah penghuni kamar (${taken}). Keluarkan penghuni dulu.`,
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

async function saveDetails(
  tx: Database,
  roomId: string,
  details: RoomDetails,
): Promise<Parsed<string>> {
  const room = await lockRoom(tx, roomId);
  if (!room) return NOT_FOUND;
  const taken = await countTaken(tx, room.id);
  if (details.capacity < taken) return tooSmall(taken);
  if (await isNumberUsed(tx, room, details.number)) {
    return numberTaken(room.dorm, details.number);
  }
  await tx.update(dormRooms).set(details).where(eq(dormRooms.id, room.id));
  return { ok: true, value: details.number };
}

/**
 * Changes the number and the kapasitas of a room, and gives back its
 * number. A kapasitas below the number of residents is refused, and so is
 * a number another room of the dorm has.
 */
export async function changeRoom(
  db: Database,
  actor: Pick<Account, "roles">,
  sentRoomId: string,
  sent: SentRoomDetails,
): Promise<Parsed<string>> {
  if (!may(actor.roles, "manage_dorm_rooms")) return NOT_ALLOWED;
  const roomId = parseId(sentRoomId);
  if (!roomId.ok) return roomId;
  const details = parseRoomDetails(sent);
  if (!details.ok) return details;
  return db.transaction((tx) => saveDetails(tx, roomId.value, details.value));
}
