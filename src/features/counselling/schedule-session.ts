import { and, eq, isNull } from "drizzle-orm";
import { type AccountForAccess, may, rowLimitForAction } from "@/auth/access";
import { visibleTo } from "@/auth/visible-students";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import {
  counsellingConsents,
  counsellingSchedules,
  counsellingSessions,
  students,
} from "@/db/schema";
import { kindOfWay } from "./session-rules";
import type { ScheduleSession } from "./session-view";

const NONE: ScheduleSession = { kind: "none" };

/**
 * What "Tandai selesai" opens once the schedule is Selesai: "Catat sesi"
 * for its student, on its day and with the Jenis of its Cara, while the
 * consent is Disetujui; only the consent message while it is not; and
 * nothing for a schedule not Selesai, not found or that has its session,
 * or for an account without the right to keep sessions. `scheduleId`
 * comes from outside.
 */
export async function readScheduleSession(
  db: Database,
  actor: AccountForAccess,
  scheduleId: unknown,
): Promise<ScheduleSession> {
  if (!may(actor.roles, "keep_counselling_sessions")) return NONE;
  if (typeof scheduleId !== "string" || !isUuid(scheduleId)) return NONE;
  const scope = visibleTo(
    rowLimitForAction(actor, "keep_counselling_sessions"),
  );
  const [found] = await db
    .select({
      studentId: students.id,
      name: students.name,
      day: counsellingSchedules.day,
      way: counsellingSchedules.way,
      consent: counsellingConsents.status,
    })
    .from(counsellingSchedules)
    .innerJoin(students, eq(students.id, counsellingSchedules.studentId))
    .leftJoin(
      counsellingConsents,
      eq(counsellingConsents.studentId, students.id),
    )
    .leftJoin(
      counsellingSessions,
      eq(counsellingSessions.scheduleId, counsellingSchedules.id),
    )
    .where(
      and(
        eq(counsellingSchedules.id, scheduleId),
        eq(counsellingSchedules.status, "done"),
        isNull(counsellingSessions.id),
        scope,
      ),
    );
  if (!found) return NONE;
  if (found.consent !== "approved") return { kind: "needs_consent" };
  return {
    kind: "open",
    start: {
      scheduleId,
      studentId: found.studentId,
      name: found.name,
      day: found.day,
      kind: kindOfWay(found.way),
    },
  };
}
