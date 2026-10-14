import { and, desc, eq, ne, sql } from "drizzle-orm";
import { type AccountForAccess, may } from "@/auth/access";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { sikuAdjustments, sikuRequests } from "@/db/schema";
import { type RequestPhoto, readRequestPhotos } from "./request-photos";
import { type ShownStatus, shownStatus } from "./request-status";
import type { SikuReason } from "./siku-ids";

/**
 * One of a student's own requests for a SIKU gain. It names the role
 * that decided it, never the staff member.
 */
export interface OwnRequest {
  id: string;
  reason: SikuReason;
  day: string;
  report: string;
  sentAt: Date;
  status: ShownStatus;
  /** The points of the gain an approval made, or null for none. */
  points: number | null;
  decidedAs: RoleId | null;
  decidedAt: Date | null;
  /** Catatan penilai; empty when nothing was noted. */
  note: string;
  photos: RequestPhoto[];
}

/** A withdrawn request is shown to nobody. */
export const NOT_WITHDRAWN = ne(sikuRequests.status, "withdrawn");

/** Whether the gain an approval made was cancelled since. */
export const GAIN_CANCELLED = sql<boolean>`${sikuAdjustments.cancelledAt} is not null`;

async function readRows(db: Database, studentId: string) {
  return db
    .select({
      id: sikuRequests.id,
      reason: sikuRequests.reason,
      day: sikuRequests.day,
      report: sikuRequests.report,
      sentAt: sikuRequests.sentAt,
      status: sikuRequests.status,
      gainCancelled: GAIN_CANCELLED,
      points: sikuAdjustments.points,
      decidedAs: sikuRequests.decidedAs,
      decidedAt: sikuRequests.decidedAt,
      note: sikuRequests.decisionNote,
    })
    .from(sikuRequests)
    .leftJoin(sikuAdjustments, eq(sikuAdjustments.id, sikuRequests.entryId))
    .where(and(eq(sikuRequests.studentId, studentId), NOT_WITHDRAWN))
    .orderBy(desc(sikuRequests.sentAt));
}

/**
 * "Pengajuan saya": the requests of the account's own student that were
 * not withdrawn, the newest first. Whose they are comes from the
 * account, never from what was asked, so a student reads no one else's.
 * Null for an account that may not ask, or with no student.
 */
export async function readOwnRequests(
  db: Database,
  account: Pick<AccountForAccess, "roles" | "studentId">,
): Promise<OwnRequest[] | null> {
  if (!may(account.roles, "ask_siku_addition")) return null;
  const { studentId } = account;
  if (studentId === null) return null;
  const rows = await readRows(db, studentId);
  const photos = await readRequestPhotos(
    db,
    rows.map((row) => row.id),
  );
  return rows.flatMap(({ status, gainCancelled, ...row }) => {
    const shown = shownStatus({ status, gainCancelled });
    if (shown === null) return [];
    return [{ ...row, status: shown, photos: photos.get(row.id) ?? [] }];
  });
}

/** How many of the requests wait for a decision. */
export function waitingCount(requests: readonly OwnRequest[]): number {
  return requests.filter((request) => request.status === "waiting").length;
}
