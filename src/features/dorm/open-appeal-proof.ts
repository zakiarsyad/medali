import { and, eq } from "drizzle-orm";
import { type AccountForAccess, may } from "@/auth/access";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import { dormViolationAppeals, dormViolations } from "@/db/schema";
import type { Download, Refusal } from "@/files/download-response";
import type { FileStore } from "@/files/file-store";

export type OpenedAppealProof =
  | { ok: true; file: Download }
  | { ok: false; refusal: Refusal };

function refused(refusal: Refusal): OpenedAppealProof {
  return { ok: false, refusal };
}

/** Whose proofs an account may open: every resident's, or one resident's. */
type ProofReach = { kind: "all" } | { kind: "own"; studentId: string };

/**
 * The proofs an account may open: all of them for the roles that decide
 * appeals, and its own resident's otherwise. Null for anyone else, also
 * for the roles that read the violations: they see only the result.
 */
function proofReachOf(
  account: Pick<AccountForAccess, "roles" | "studentId">,
): ProofReach | null {
  if (may(account.roles, "decide_dorm_violation_appeals")) {
    return { kind: "all" };
  }
  const { studentId } = account;
  if (!may(account.roles, "appeal_own_dorm_violation") || studentId === null) {
    return null;
  }
  return { kind: "own", studentId };
}

interface KeptProof {
  key: string;
  name: string;
  contentType: string;
}

/** The proof of an appeal within reach, or null, also for one with no proof kept. */
async function proofWithin(
  db: Database,
  reach: ProofReach,
  appealId: string,
): Promise<KeptProof | null> {
  const ofStudent =
    reach.kind === "own"
      ? eq(dormViolations.studentId, reach.studentId)
      : undefined;
  const [appeal] = await db
    .select({
      key: dormViolationAppeals.fileKey,
      name: dormViolationAppeals.fileName,
      contentType: dormViolationAppeals.fileContentType,
    })
    .from(dormViolationAppeals)
    .innerJoin(
      dormViolations,
      eq(dormViolations.id, dormViolationAppeals.violationId),
    )
    .where(and(eq(dormViolationAppeals.id, appealId), ofStudent));
  if (!appeal || appeal.key === null) return null;
  if (appeal.name === null || appeal.contentType === null) return null;
  return {
    key: appeal.key,
    name: appeal.name,
    contentType: appeal.contentType,
  };
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
    console.error("The kept proof of an appeal was not opened.", error);
    return "unreachable";
  }
}

/**
 * The proof of an appeal of a dorm violation, for the accounts that may
 * open it: the resident who sent it, BAM - BPHK and BAM - KI. The
 * account is checked before anything is looked up, and the proof of
 * another resident answers as one that does not exist, so nobody learns
 * which appeals there are. `null` is a visitor who is not signed in.
 * `id` comes from the address and is not trusted.
 */
export async function openAppealProof(
  db: Database,
  store: FileStore | null,
  account: Pick<AccountForAccess, "roles" | "studentId"> | null,
  id: string,
): Promise<OpenedAppealProof> {
  if (account === null) return refused("not-signed-in");
  const reach = proofReachOf(account);
  if (reach === null) return refused("not-allowed");
  // Where file keeping is off, no proof was kept.
  if (store === null || !isUuid(id)) return refused("not-found");

  const kept = await proofWithin(db, reach, id);
  if (kept === null) return refused("not-found");
  const bytes = await keptBytes(store, kept.key);
  if (bytes === "unreachable") return refused("unreachable");
  if (bytes === null) return refused("not-found");
  return {
    ok: true,
    file: { name: kept.name, contentType: kept.contentType, bytes },
  };
}
