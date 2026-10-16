import { desc } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { healthNotes } from "@/db/schema";

/**
 * Each student's latest health note, as a table to join students to:
 * the one saved last, so a correction wins even when its Tanggal is
 * earlier. A student with none has no row here.
 */
export function latestHealthNotes(db: Database) {
  return db
    .selectDistinctOn([healthNotes.studentId], {
      studentId: healthNotes.studentId,
      noteId: healthNotes.id,
      category: healthNotes.category,
    })
    .from(healthNotes)
    .orderBy(
      healthNotes.studentId,
      desc(healthNotes.savedAt),
      desc(healthNotes.id),
    )
    .as("latest_health_notes");
}
