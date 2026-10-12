import { count, eq } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { dormCompanions, dormRoomPlaces, dormRooms } from "@/db/schema";

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

/**
 * How many places of a room are taken: by its residents, and by the kakak
 * pendamping placed in it.
 */
export async function countTaken(
  tx: Database,
  roomId: string,
): Promise<number> {
  const [residents] = await tx
    .select({ taken: count() })
    .from(dormRoomPlaces)
    .where(eq(dormRoomPlaces.roomId, roomId));
  const [companions] = await tx
    .select({ taken: count() })
    .from(dormCompanions)
    .where(eq(dormCompanions.roomId, roomId));
  return (residents?.taken ?? 0) + (companions?.taken ?? 0);
}
