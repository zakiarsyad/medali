import { createHash } from "node:crypto";
import { and, eq, max } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { sikuAdjustments, sikuUploads } from "@/db/schema";
import { sourceName } from "@/files/csv-file";
import type { SentFile } from "@/files/file-check";
import { IN_FORCE } from "./siku-totals";

/** What an upload keeps of its file: the name as shown, and a fingerprint. */
export interface UploadMark {
  fileName: string;
  fingerprint: string;
}

/** The mark of a sent file. Two files with the same mark hold the same rows. */
export function uploadMarkOf(file: SentFile): UploadMark {
  return {
    fileName: sourceName(file.name),
    fingerprint: createHash("sha256").update(file.bytes).digest("hex"),
  };
}

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
