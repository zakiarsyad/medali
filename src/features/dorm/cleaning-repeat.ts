import { and, eq, gt, isNull, type SQL } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { dormCleaningDuties } from "@/db/schema";
import type { DormId } from "@/dorms/dorms";
import { lockPlace } from "./cleaning-duties";
import { repeatDay } from "./cleaning-repeat-day";
import { lockRoom } from "./room-lock";

/** A duty validated Tidak memenuhi, which is to be cleaned again. */
export interface FailedDuty {
  id: string;
  dorm: DormId;
  /** Null for a duty of the room's own room. */
  placeId: string | null;
  /** Null once the room is removed. */
  roomId: string | null;
}

/** The duties that hold the same place, or the same own room, as a duty. */
function sameSpot(duty: FailedDuty, roomId: string): SQL | undefined {
  if (duty.placeId === null) {
    return and(
      eq(dormCleaningDuties.roomId, roomId),
      isNull(dormCleaningDuties.placeId),
    );
  }
  return eq(dormCleaningDuties.placeId, duty.placeId);
}

/** The days after `today` on which the spot of a duty is taken already. */
async function takenDaysAfter(
  tx: Database,
  duty: FailedDuty,
  roomId: string,
  today: string,
): Promise<string[]> {
  const taken = await tx
    .select({ day: dormCleaningDuties.day })
    .from(dormCleaningDuties)
    .where(and(sameSpot(duty, roomId), gt(dormCleaningDuties.day, today)));
  return taken.map((each) => each.day);
}

/**
 * Whether the place of a duty is still there, held until the change ends
 * so that no room is given it meanwhile. A duty of an own room has none.
 */
async function placeIsKept(tx: Database, duty: FailedDuty): Promise<boolean> {
  if (duty.placeId === null) return true;
  return (await lockPlace(tx, duty.placeId)) !== null;
}

/**
 * Gives the room of a duty validated Tidak memenuhi the same place, or its
 * own room, again: "Pembersihan ulang", the day after `today`, or the
 * first later day that place or own room is free. Gives back that day, or
 * null when the room or the place has been removed since, and nothing is
 * given. The room and the place are held until the change ends, as
 * "Tugaskan" holds them, so no other duty takes that day meanwhile.
 * `createdBy` is who validated it.
 */
export async function scheduleRepeat(
  tx: Database,
  duty: FailedDuty,
  createdBy: string,
  today: string,
): Promise<string | null> {
  if (duty.roomId === null) return null;
  // The place is held before the room, in the order "Tugaskan" holds them,
  // so the two never wait for each other.
  if (!(await placeIsKept(tx, duty))) return null;
  const room = await lockRoom(tx, duty.roomId);
  if (!room) return null;

  const taken = await takenDaysAfter(tx, duty, room.id, today);
  const day = repeatDay(today, taken);
  await tx.insert(dormCleaningDuties).values({
    day,
    dorm: duty.dorm,
    placeId: duty.placeId,
    roomId: room.id,
    roomNumber: room.number,
    createdBy,
    repeatOf: duty.id,
  });
  return day;
}
