import type { Database } from "@/db/connect";
import { counsellingScheduleChanges, counsellingSchedules } from "@/db/schema";
import type { ScheduleStatus } from "./schedule-ids";

/** Made-up requests for the checks of this area. */

export interface TestSchedule {
  studentId: string;
  /** The student's own account, who registered. */
  studentAccountId: string;
  status?: ScheduleStatus;
  day?: string;
  counsellorId?: string | null;
  story?: string | null;
  reason?: string | null;
  at?: Date;
}

/** A voluntary request with the log line of its registration. */
export async function addTestSchedule(
  db: Database,
  sent: TestSchedule,
): Promise<string> {
  const at = sent.at ?? new Date("2026-10-19T03:00:00Z");
  const status = sent.status ?? "submitted";
  const [added] = await db
    .insert(counsellingSchedules)
    .values({
      studentId: sent.studentId,
      kind: "voluntary",
      status,
      topic: "academic",
      day: sent.day ?? "2026-10-21",
      hour: "10:00",
      way: "in_person",
      story: sent.story ?? null,
      reason: sent.reason ?? null,
      counsellorId: sent.counsellorId ?? null,
      createdAt: at,
      changedBy: sent.studentAccountId,
      changedAt: at,
    })
    .returning({ id: counsellingSchedules.id });
  if (!added) throw new Error("The request was not added.");
  await db.insert(counsellingScheduleChanges).values({
    scheduleId: added.id,
    changedBy: sent.studentAccountId,
    changedAt: at,
    step: "register",
    statusBefore: null,
    statusAfter: "submitted",
  });
  return added.id;
}
