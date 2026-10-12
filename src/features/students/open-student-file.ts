import { eq } from "drizzle-orm";
import { may } from "@/auth/access";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import { studentBatchFiles } from "@/db/schema";
import type { Download, Refusal } from "@/files/download-response";
import type { FileStore } from "@/files/file-store";
import type { Actor } from "./input-student";

export type OpenedStudentFile =
  | { ok: true; file: Download }
  | { ok: false; refusal: Refusal };

function refused(refusal: Refusal): OpenedStudentFile {
  return { ok: false, refusal };
}

/**
 * Whether an account may open the kept files of students: those who may
 * put students in, and nobody else. `null` is a visitor who is not
 * signed in.
 */
export function studentFileRefusal(actor: Actor | null): Refusal | null {
  if (!actor) return "not-signed-in";
  if (!may(actor.roles, "input_new_students")) return "not-allowed";
  return null;
}

/**
 * The kept file of a batch of students, for an account that may open it.
 * The account is checked before the file is looked up, so someone without
 * the right cannot learn which files exist. `id` comes from the address
 * and is not trusted.
 */
export async function openStudentFile(
  db: Database,
  store: FileStore,
  actor: Actor | null,
  id: string,
): Promise<OpenedStudentFile> {
  const refusal = studentFileRefusal(actor);
  if (refusal) return refused(refusal);
  if (!isUuid(id)) return refused("not-found");

  const [record] = await db
    .select({
      objectKey: studentBatchFiles.objectKey,
      name: studentBatchFiles.fileName,
      contentType: studentBatchFiles.contentType,
    })
    .from(studentBatchFiles)
    .where(eq(studentBatchFiles.id, id))
    .limit(1);
  if (!record) return refused("not-found");
  const bytes = await store.get(record.objectKey);
  if (!bytes) return refused("not-found");
  return {
    ok: true,
    file: { name: record.name, contentType: record.contentType, bytes },
  };
}
