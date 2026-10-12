import { and, eq } from "drizzle-orm";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import type { Database } from "@/db/connect";
import { dormRoomPlaces } from "@/db/schema";
import type { Parsed } from "@/parsed";
import { NOT_ALLOWED } from "./not-allowed";
import type { SentPlace } from "./place-resident";
import { NOT_FOUND, parseId } from "./room-input";

/**
 * Takes a resident out of their room, so they are without a room again.
 * Refused when the resident is not in that room.
 */
export async function takeOutResident(
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
    .delete(dormRoomPlaces)
    .where(
      and(
        eq(dormRoomPlaces.roomId, roomId.value),
        eq(dormRoomPlaces.studentId, studentId.value),
      ),
    )
    .returning({ studentId: dormRoomPlaces.studentId });
  if (freed.length === 0) return NOT_FOUND;
  return { ok: true, value: "Penghuni dikeluarkan dari kamar." };
}
