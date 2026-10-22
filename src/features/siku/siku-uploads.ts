import { and, eq, max } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { sikuAdjustments, sikuUploads } from "@/db/schema";
import type { UploadMark } from "@/files/upload-mark";
import { IN_FORCE } from "./siku-totals";

/**
 * The day the same file was last saved, by an upload that still has a
 * row in force, or null when there is none.
 */
export async function savedBefore(
  db: Database,
  mark: UploadMark,
): Promise<string | null> {
  const [found] = await db
    .select({ day: max(sikuAdjustments.day) })
    .from(sikuUploads)
    .innerJoin(sikuAdjustments, eq(sikuAdjustments.uploadId, sikuUploads.id))
    .where(
      and(
        eq(sikuUploads.fileName, mark.fileName),
        eq(sikuUploads.fingerprint, mark.fingerprint),
        IN_FORCE,
      ),
    );
  return found?.day ?? null;
}
