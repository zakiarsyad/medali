import { and, eq } from "drizzle-orm";
import { type AccountForAccess, may } from "@/auth/access";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import { accounts, counsellingSharings, students } from "@/db/schema";
import type { Parsed } from "@/parsed";
import { latestScreenings } from "./latest-screenings";
import { logSharedReads } from "./log-shared-reads";
import { readSessionSummary } from "./own-sessions";
import { sharedReachOf } from "./shared-reach";
import type { SharedDetail, SharedScreening } from "./shared-view";
import { SHARED_GONE, SHARED_NOT_ALLOWED } from "./shared-words";

const GONE = { ok: false, error: SHARED_GONE } as const;

/** The student's published sharing the account reaches, with who published it. */
async function reachedSharing(
  tx: Database,
  actor: AccountForAccess,
  studentId: string,
) {
  const reach = sharedReachOf(actor);
  if (reach === null) return null;
  const [found] = await tx
    .select({
      id: counsellingSharings.id,
      data: counsellingSharings.data,
      summary: counsellingSharings.summary,
      publishedAt: counsellingSharings.publishedAt,
      publishedByName: accounts.name,
    })
    .from(counsellingSharings)
    .innerJoin(students, eq(students.id, counsellingSharings.studentId))
    .innerJoin(accounts, eq(accounts.id, counsellingSharings.publishedBy))
    .where(and(eq(counsellingSharings.studentId, studentId), reach));
  return found ?? null;
}

/** The level, instrument and date of the student's latest screening, or null for none. */
async function readSharedScreening(
  tx: Database,
  studentId: string,
): Promise<SharedScreening | null> {
  const latest = latestScreenings(tx, {});
  const [found] = await tx
    .select({
      level: latest.level,
      instrument: latest.instrument,
      screenedOn: latest.screenedOn,
    })
    .from(latest)
    .where(eq(latest.studentId, studentId));
  return found ?? null;
}

/**
 * "Rincian" of a student whose data is published for the account: only
 * the parts the student agreed to share, read when it is opened, and who
 * published it when. The level is of the latest screening, without its
 * scores, "Risiko" mark or note. Each opening is logged in the same
 * transaction: who, whose data, which sharing and when, never what it
 * showed.
 * Refused, with nothing read or logged, for an account without the
 * right, and for a student whose sharing it does not reach, also one
 * withdrawn since the list was loaded. `studentId` comes from outside.
 */
export async function openSharedDetail(
  db: Database,
  actor: AccountForAccess,
  studentId: unknown,
  now: Date = new Date(),
): Promise<Parsed<SharedDetail>> {
  if (!may(actor.roles, "view_shared_counselling_data")) {
    return { ok: false, error: SHARED_NOT_ALLOWED };
  }
  if (typeof studentId !== "string" || !isUuid(studentId)) return GONE;
  return db.transaction(async (tx): Promise<Parsed<SharedDetail>> => {
    const sharing = await reachedSharing(tx, actor, studentId);
    if (sharing === null || sharing.publishedAt === null) return GONE;
    const sharesCounselling = sharing.data.includes("counselling");
    const sharesSummary = sharing.data.includes("summary");
    const screening = sharing.data.includes("level")
      ? await readSharedScreening(tx, studentId)
      : null;
    const counselling = sharesCounselling
      ? await readSessionSummary(tx, studentId, now)
      : null;
    await logSharedReads(
      tx,
      actor.id,
      [{ sharingId: sharing.id, studentId }],
      now,
    );
    return {
      ok: true,
      value: {
        data: sharing.data,
        screening,
        counselling,
        summary: sharesSummary ? sharing.summary : null,
        publishedByName: sharing.publishedByName,
        publishedAt: sharing.publishedAt,
      },
    };
  });
}
