import { and, eq, isNull } from "drizzle-orm";
import type { AccountForAccess } from "@/auth/access";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import { activityClarifications, activitySchedules } from "@/db/schema";
import type { Download, Refusal } from "@/files/download-response";
import type { FileStore } from "@/files/file-store";
import { mayDecideClarifications } from "./may-decide-clarifications";
import { readOwnStudent } from "./own-student";

export type OpenedClarificationFile =
  | { ok: true; file: Download }
  | { ok: false; refusal: Refusal };

function refused(refusal: Refusal): OpenedClarificationFile {
  return { ok: false, refusal };
}

/** Whose files an account may open: every student's, or one student's. */
type FileReach = { kind: "all" } | { kind: "own"; studentId: string };

/**
 * The files an account may open: all of them with the right to decide
 * clarifications, and its own student's otherwise. Null for anyone else,
 * also for a role that reads the clarifications of its students: between
 * two options for personal data, fewer people see the file.
 */
async function fileReachOf(
  db: Database,
  account: AccountForAccess,
): Promise<FileReach | null> {
  if (mayDecideClarifications(account)) return { kind: "all" };
  const student = await readOwnStudent(db, account);
  if (student === null) return null;
  return { kind: "own", studentId: student.id };
}

interface KeptFile {
  key: string;
  name: string;
  contentType: string;
}

/**
 * The file of a clarification, when the clarification is within reach
 * and its schedule is not removed. Null otherwise, and for a
 * clarification whose file is not kept.
 */
async function fileWithin(
  db: Database,
  reach: FileReach,
  clarificationId: string,
): Promise<KeptFile | null> {
  const ofStudent =
    reach.kind === "own"
      ? eq(activityClarifications.studentId, reach.studentId)
      : undefined;
  const [clarification] = await db
    .select({
      key: activityClarifications.fileKey,
      name: activityClarifications.fileName,
      contentType: activityClarifications.fileContentType,
    })
    .from(activityClarifications)
    .innerJoin(
      activitySchedules,
      eq(activitySchedules.id, activityClarifications.scheduleId),
    )
    .where(
      and(
        eq(activityClarifications.id, clarificationId),
        ofStudent,
        isNull(activitySchedules.deletedAt),
      ),
    );
  if (!clarification || clarification.key === null) return null;
  return { ...clarification, key: clarification.key };
}

/**
 * A storage that fails or cannot be reached is not an error to pass on:
 * the person is told to try again, and the cause is logged, which names
 * no person and no key.
 */
async function keptBytes(
  store: FileStore,
  fileKey: string,
): Promise<Uint8Array | "unreachable" | null> {
  try {
    return await store.get(fileKey);
  } catch (error) {
    console.error("The kept file of a clarification was not opened.", error);
    return "unreachable";
  }
}

/**
 * The file of a clarification, for the accounts that may open it: the
 * student who sent it, and an account with the right to decide
 * clarifications. The account is checked before anything is looked up,
 * and the file of another student answers as one that does not exist, so
 * nobody learns which clarifications there are. `null` is a visitor who
 * is not signed in. `id` comes from the address and is not trusted.
 */
export async function openClarificationFile(
  db: Database,
  store: FileStore | null,
  account: AccountForAccess | null,
  id: string,
): Promise<OpenedClarificationFile> {
  if (account === null) return refused("not-signed-in");
  const reach = await fileReachOf(db, account);
  if (reach === null) return refused("not-allowed");
  // Where file keeping is off, no file was kept.
  if (store === null || !isUuid(id)) return refused("not-found");

  const kept = await fileWithin(db, reach, id);
  if (kept === null) return refused("not-found");
  const bytes = await keptBytes(store, kept.key);
  if (bytes === "unreachable") return refused("unreachable");
  if (bytes === null) return refused("not-found");
  return {
    ok: true,
    file: { name: kept.name, contentType: kept.contentType, bytes },
  };
}
