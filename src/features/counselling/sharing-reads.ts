import { and, desc, eq, inArray, type SQL } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { type AccountForAccess, may, rowLimitForAction } from "@/auth/access";
import { visibleTo } from "@/auth/visible-students";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import { versionOf } from "@/db/row-version";
import {
  accounts,
  counsellingConsents,
  counsellingSessions,
  counsellingSharings,
  students,
} from "@/db/schema";
import type { Parsed } from "@/parsed";
import { STUDENT_NOT_FOUND } from "./consent-words";
import { CURRENT_SHARING_STATUSES } from "./sharing-ids";
import {
  type SharingPanel,
  type SharingView,
  withoutPublisher,
} from "./sharing-view";

const publisher = alias(accounts, "publisher");

/** The newest sharing that matches, or null for none. */
async function newestSharing(
  db: Database,
  where: SQL | undefined,
): Promise<SharingView | null> {
  const [found] = await db
    .select({
      id: counsellingSharings.id,
      status: counsellingSharings.status,
      data: counsellingSharings.data,
      recipients: counsellingSharings.recipients,
      summary: counsellingSharings.summary,
      way: counsellingSharings.way,
      answeredAt: counsellingSharings.answeredAt,
      publishedAt: counsellingSharings.publishedAt,
      publishedByName: publisher.name,
      changedAt: counsellingSharings.changedAt,
    })
    .from(counsellingSharings)
    .leftJoin(publisher, eq(publisher.id, counsellingSharings.publishedBy))
    .where(where)
    .orderBy(desc(counsellingSharings.askedAt), desc(counsellingSharings.id))
    .limit(1);
  if (!found) return null;
  const { changedAt, ...rest } = found;
  return { ...rest, version: versionOf(changedAt) };
}

/** A student's latest sharing, current or ended, or null for none. */
export function readLatestSharing(
  db: Database,
  studentId: string,
): Promise<SharingView | null> {
  return newestSharing(db, eq(counsellingSharings.studentId, studentId));
}

/** A student's current sharing, or null when none is current. */
export function readCurrentSharing(
  db: Database,
  studentId: string,
): Promise<SharingView | null> {
  return newestSharing(
    db,
    and(
      eq(counsellingSharings.studentId, studentId),
      inArray(counsellingSharings.status, CURRENT_SHARING_STATUSES),
    ),
  );
}

/**
 * The sharing a recipient may read of a student: only a Dipublikasikan
 * one, so a withdrawn or cancelled sharing is gone at once. The
 * recipients' screen reads through this, and also asks `recipientSees`.
 */
export function readShownSharing(
  db: Database,
  studentId: string,
): Promise<SharingView | null> {
  return newestSharing(
    db,
    and(
      eq(counsellingSharings.studentId, studentId),
      eq(counsellingSharings.status, "published"),
    ),
  );
}

/** Whether Konselor wrote down at least one session of the student. */
export async function hasSessions(
  db: Database,
  studentId: string,
): Promise<boolean> {
  const [found] = await db
    .select({ id: counsellingSessions.id })
    .from(counsellingSessions)
    .where(eq(counsellingSessions.studentId, studentId))
    .limit(1);
  return found !== undefined;
}

async function hasConsent(db: Database, studentId: string): Promise<boolean> {
  const [found] = await db
    .select({ status: counsellingConsents.status })
    .from(counsellingConsents)
    .where(eq(counsellingConsents.studentId, studentId));
  return found?.status === "approved";
}

/**
 * The name of a student Konselor may share the data of: any student
 * that is not removed. Null for any other id; what was sent comes from
 * outside.
 */
export async function sharingStudentName(
  db: Database,
  actor: AccountForAccess,
  studentId: unknown,
): Promise<string | null> {
  if (typeof studentId !== "string" || !isUuid(studentId)) return null;
  const scope = visibleTo(rowLimitForAction(actor, "share_counselling_data"));
  const [found] = await db
    .select({ name: students.name })
    .from(students)
    .where(and(eq(students.id, studentId), scope));
  return found?.name ?? null;
}

/**
 * "Publikasi data kesehatan mental" of a picked student: whether they
 * have a session and consent, and their latest sharing. Refused for a
 * student Konselor may not pick; an account without the right finds no
 * student.
 */
export async function readSharingPanel(
  db: Database,
  actor: AccountForAccess,
  studentId: unknown,
): Promise<Parsed<SharingPanel>> {
  const refused = { ok: false, error: STUDENT_NOT_FOUND } as const;
  if (!may(actor.roles, "share_counselling_data")) return refused;
  const name = await sharingStudentName(db, actor, studentId);
  if (name === null || typeof studentId !== "string") return refused;
  const [sessions, consent, sharing] = await Promise.all([
    hasSessions(db, studentId),
    hasConsent(db, studentId),
    readLatestSharing(db, studentId),
  ]);
  return {
    ok: true,
    value: { hasSessions: sessions, hasConsent: consent, sharing },
  };
}

/**
 * The signed-in student's own current sharing, or null for none: always
 * their own, never a student that was sent, and without the name of
 * the Konselor who published it.
 */
export async function readOwnSharing(
  db: Database,
  actor: AccountForAccess,
): Promise<SharingView | null> {
  if (!may(actor.roles, "answer_own_counselling_sharing")) return null;
  if (actor.studentId === null) return null;
  const sharing = await readCurrentSharing(db, actor.studentId);
  return sharing === null ? null : withoutPublisher(sharing);
}
