import { and, eq } from "drizzle-orm";
import type { Database } from "./connect";
import { dormCompanions } from "./schema";

/**
 * Ends the duty of a kakak pendamping: Tidak aktif, and out of their room.
 * It stays ended until someone starts it again. Nothing happens for a
 * student who is not an active kakak pendamping.
 *
 * Kept here because two areas end a duty: the dorm, and the student data
 * when a student goes on leave, stops being active or is removed.
 */
export async function endCompanionDuty(
  db: Database,
  studentId: string,
): Promise<void> {
  await db
    .update(dormCompanions)
    .set({ isActive: false, roomId: null })
    .where(
      and(
        eq(dormCompanions.studentId, studentId),
        eq(dormCompanions.isActive, true),
      ),
    );
}
