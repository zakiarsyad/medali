import { count, eq } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { dormRoomPlaces, dormRooms } from "@/db/schema";

export type LockedRoom = typeof dormRooms.$inferSelect;

/**
 * Reads a room and holds it until the transaction ends. Every change to a
 * room or to its residents starts here, so two of them never run at the
 * same moment: the second waits and then sees what the first one saved.
 */
export async function lockRoom(
  tx: Database,
  roomId: string,
): Promise<LockedRoom | null> {
  const [room] = await tx
    .select()
    .from(dormRooms)
    .where(eq(dormRooms.id, roomId))
    .for("update");
  return room ?? null;
}

/** How many places of a room are taken. */
export async function countTaken(
  tx: Database,
  roomId: string,
): Promise<number> {
  const [counted] = await tx
    .select({ taken: count() })
    .from(dormRoomPlaces)
    .where(eq(dormRoomPlaces.roomId, roomId));
  return counted?.taken ?? 0;
}
