import type { Database } from "@/db/connect";
import { counsellingScheduleChanges, counsellingSchedules } from "@/db/schema";
import type {
  AssignmentKind,
  ScheduleStatus,
} from "@/mental-health/schedule-ids";

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

export interface TestAssignment {
  studentId: string;
  /** The Pembina Disiplin Mahasiswa or Penilai Mahasiswa who sent it. */
  senderId: string;
  kind?: AssignmentKind;
  status?: ScheduleStatus;
  /** The time Konselor set; none while it is Menunggu jadwal. */
  day?: string | null;
  counsellorId?: string | null;
  reason?: string | null;
  at?: Date;
}

/** The test "Dasar" of an assignment: a Kategori and Jenjang only. */
export const TEST_BASIS = "Pelanggaran disiplin sedang jenjang pertama";

export const TEST_SENDER_MESSAGE = "Pesan uji pengirim.";

/**
 * An assignment with the log line of its sending, Menunggu jadwal unless
 * another status is asked; a time is set for any other status.
 */
export async function addTestAssignment(
  db: Database,
  sent: TestAssignment,
): Promise<string> {
  const at = sent.at ?? new Date("2026-10-19T03:00:00Z");
  const kind = sent.kind ?? "assigned";
  const status = sent.status ?? "awaiting";
  const hasTime = status !== "awaiting";
  const [added] = await db
    .insert(counsellingSchedules)
    .values({
      studentId: sent.studentId,
      kind,
      status,
      day: hasTime ? (sent.day ?? "2026-10-22") : null,
      hour: hasTime ? "10:00" : null,
      way: hasTime ? "in_person" : null,
      basis: TEST_BASIS,
      senderMessage: TEST_SENDER_MESSAGE,
      reason: sent.reason ?? null,
      counsellorId: sent.counsellorId ?? null,
      createdAt: at,
      changedBy: sent.senderId,
      changedAt: at,
    })
    .returning({ id: counsellingSchedules.id });
  if (!added) throw new Error("The assignment was not added.");
  await db.insert(counsellingScheduleChanges).values({
    scheduleId: added.id,
    changedBy: sent.senderId,
    changedAt: at,
    step: kind === "assigned" ? "assign" : "call",
    statusBefore: null,
    statusAfter: "awaiting",
  });
  return added.id;
}
