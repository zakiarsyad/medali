import { type AccountForAccess, may } from "@/auth/access";
import type { Database } from "@/db/connect";
import type { SharingStatus } from "@/mental-health/sharing-ids";
import {
  CANCELLED_MESSAGE,
  PAPER_MESSAGE,
  PULLED_MESSAGE,
  publishedMessage,
} from "@/mental-health/sharing-words";
import { NOT_ALLOWED, type SharingOutcome } from "./change-sharing";
import { STUDENT_NOT_FOUND } from "./consent-words";
import { applySharingPress } from "./press-sharing";
import { sharingStudentName } from "./sharing-reads";
import type { CounsellorSharingMove } from "./sharing-rules";

/** What Konselor does to a request already sent. */
export type CounsellorStep = Exclude<CounsellorSharingMove, "ask">;

const NOT_FOUND = { kind: "refused", error: STUDENT_NOT_FOUND } as const;

/** The message of a kept step, as in the prototype. */
function doneOf(
  move: CounsellorStep,
  name: string,
): (before: SharingStatus) => string {
  if (move === "record_paper") return () => PAPER_MESSAGE;
  if (move === "publish") return () => publishedMessage(name);
  return (before) =>
    before === "published" ? PULLED_MESSAGE : CANCELLED_MESSAGE;
}

/**
 * "Catat persetujuan tertulis", "Publikasikan", and "Batalkan
 * permintaan", "Batalkan" or "Tarik publikasi", by Konselor, on the
 * sharing the panel showed of a student who is not removed. Publishing
 * is kept only for a Disetujui sharing that did not change since. What
 * was sent comes from outside. Refused for any role without the right,
 * giving nothing back.
 */
export async function changeSharingAsCounsellor(
  db: Database,
  actor: AccountForAccess,
  studentId: unknown,
  move: CounsellorStep,
  sharingId: unknown,
  version: unknown,
  now: Date = new Date(),
): Promise<SharingOutcome> {
  if (!may(actor.roles, "share_counselling_data")) return NOT_ALLOWED;
  const name = await sharingStudentName(db, actor, studentId);
  if (name === null || typeof studentId !== "string") return NOT_FOUND;
  return applySharingPress(db, {
    actorId: actor.id,
    studentId,
    move,
    sharingId,
    version,
    doneAfter: doneOf(move, name),
    now,
  });
}
