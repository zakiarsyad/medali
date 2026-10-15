import { and, eq, isNull } from "drizzle-orm";
import { type AccountForAccess, may } from "@/auth/access";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import { skpmUploadChanges, skpmUploads } from "@/db/schema";
import type { Parsed } from "@/parsed";
import {
  ALREADY_REMOVED,
  NOT_ALLOWED_TO_UPLOAD,
  UPLOAD_NOT_FOUND,
} from "./skpm-messages";

async function remove(
  tx: Database,
  actor: AccountForAccess,
  id: string,
  moment: Date,
): Promise<Parsed<string>> {
  const removed = await tx
    .update(skpmUploads)
    .set({ removedBy: actor.id, removedAt: moment })
    .where(and(eq(skpmUploads.id, id), isNull(skpmUploads.removedAt)))
    .returning({ fileName: skpmUploads.fileName });
  const [upload] = removed;
  if (!upload) {
    const [kept] = await tx
      .select({ id: skpmUploads.id })
      .from(skpmUploads)
      .where(eq(skpmUploads.id, id));
    return kept ? ALREADY_REMOVED : UPLOAD_NOT_FOUND;
  }
  await tx.insert(skpmUploadChanges).values({
    uploadId: id,
    changedBy: actor.id,
    changedAt: moment,
    action: "removed",
  });
  return { ok: true, value: upload.fileName };
}

/**
 * "Hapus" on an upload: marks it removed with who and when, never erases
 * it, and adds a line to the log. Its rows count no more; an upload a
 * removed "Ganti semua data" had replaced counts again. Refused for a
 * role without the right "Unggah data SKPM", for an upload that is not
 * there and for one removed before. Gives the file name of the upload.
 */
export async function removeSkpmUpload(
  db: Database,
  actor: AccountForAccess,
  id: string,
  moment: Date = new Date(),
): Promise<Parsed<string>> {
  if (!may(actor.roles, "upload_skpm")) return NOT_ALLOWED_TO_UPLOAD;
  if (!isUuid(id)) return UPLOAD_NOT_FOUND;
  return db.transaction((tx) => remove(tx, actor, id, moment));
}
