import type { Database } from "@/db/connect";
import { counsellingSharingReads } from "@/db/schema";

/** A published sharing whose data a recipient was shown. */
export interface SharedShowing {
  sharingId: string;
  studentId: string;
}

/**
 * One line in the log of readings for each showing: who, whose data,
 * which sharing and when, never what it showed.
 */
export async function logSharedReads(
  tx: Database,
  readBy: string,
  showings: readonly SharedShowing[],
  now: Date,
): Promise<void> {
  if (showings.length === 0) return;
  await tx.insert(counsellingSharingReads).values(
    showings.map((showing) => ({
      sharingId: showing.sharingId,
      studentId: showing.studentId,
      readBy,
      readAt: now,
    })),
  );
}
