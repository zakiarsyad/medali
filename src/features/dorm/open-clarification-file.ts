import { and, eq, isNull } from "drizzle-orm";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import { dormClarifications } from "@/db/schema";
import type { Download, Refusal } from "@/files/download-response";
import type { FileStore } from "@/files/file-store";

export type OpenedClarificationFile =
  | { ok: true; file: Download }
  | { ok: false; refusal: Refusal };

function refused(refusal: Refusal): OpenedClarificationFile {
  return { ok: false, refusal };
}

/** Whose files an account may open: every resident's, or one resident's. */
type FileReach = { kind: "all" } | { kind: "own"; studentId: string };

/**
 * The files an account may open: all of them for the roles that check
 * and decide clarifications, and its own resident's otherwise. Null for
 * anyone else, also for the roles that only read the clarifications: the
 * file may be proof of illness, which is health data, so fewer people see
 * it.
 */
function fileReachOf(
  account: Pick<Account, "roles" | "studentId">,
): FileReach | null {
  if (may(account.roles, "open_dorm_clarification_files")) {
    return { kind: "all" };
  }
  const { studentId } = account;
  if (!may(account.roles, "ask_dorm_clarification") || studentId === null) {
    return null;
  }
  return { kind: "own", studentId };
}

interface KeptFile {
  key: string;
  name: string;
  contentType: string;
}

/**
 * The file of a clarification within reach. Null otherwise, and for a
 * clarification whose file is not kept.
 */
async function fileWithin(
  db: Database,
  reach: FileReach,
  clarificationId: string,
): Promise<KeptFile | null> {
  const ofStudent =
    reach.kind === "own"
      ? eq(dormClarifications.studentId, reach.studentId)
      : undefined;
  const [clarification] = await db
    .select({
      key: dormClarifications.fileKey,
      name: dormClarifications.fileName,
      contentType: dormClarifications.fileContentType,
    })
    .from(dormClarifications)
    .where(
      and(
        eq(dormClarifications.id, clarificationId),
        isNull(dormClarifications.fileRemovedAt),
        ofStudent,
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
    console.error(
      "The kept file of a dorm clarification was not opened.",
      error,
    );
    return "unreachable";
  }
}

/**
 * The file of a clarification of a dorm absence, for the accounts that
 * may open it: the resident who sent it, BAM - BPHK, BAM - KI and
 * Pengelola Asrama. The account is checked before anything is looked up,
 * and the file of another resident answers as one that does not exist,
 * so nobody learns which clarifications there are. `null` is a visitor
 * who is not signed in. `id` comes from the address and is not trusted.
 */
export async function openDormClarificationFile(
  db: Database,
  store: FileStore | null,
  account: Pick<Account, "roles" | "studentId"> | null,
  id: string,
): Promise<OpenedClarificationFile> {
  if (account === null) return refused("not-signed-in");
  const reach = fileReachOf(account);
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
