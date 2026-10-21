// Sample NIMs of this file: 9986207000 to 9986207099.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import {
  counsellingConsentChanges,
  counsellingScheduleChanges,
  counsellingSchedules,
} from "@/db/schema";
import { withOwnTestDatabase } from "@/db/test-database-at-once";
import {
  cancelSchedule,
  markScheduleDone,
  rescheduleSchedule,
} from "./change-schedule";
import {
  acceptSchedule,
  approveSchedule,
  askAnotherTime,
  type CounsellorMoveOutcome,
  proposeSchedule,
  type StudentMoveOutcome,
} from "./move-schedule";
import { registerCounselling } from "./register-counselling";
import {
  CANCELLED,
  REGISTERED,
  SCHEDULE_CHANGED_SINCE,
  STILL_ACTIVE,
} from "./schedule-words";
import { setScheduleTime } from "./set-schedule-time";
import { addTestActor, addTestPeople } from "./test-consents";
import { addTestAssignment, addTestSchedule } from "./test-schedules";

/*
 * Two presses at the same moment need two connections that both see the
 * saved rows. So these checks have a database of their own, dropped at
 * the end.
 */
const own = withOwnTestDatabase("schedule");

// Selasa 20 October 2026, 10:00 on campus.
const NOW = new Date("2026-10-20T03:00:00Z");

const SENT = {
  topic: "academic",
  day: "2026-10-21",
  hour: "10:00",
  way: "in_person",
  story: null,
  consented: true,
};

describe("Daftar konseling pressed twice at the same moment", () => {
  it("keeps one request and one consent change: the second waits, then is told the first is active", async () => {
    const people = await addTestPeople(own.db, "Prodi Uji Daftar Sekaligus", [
      "9986207001",
    ]);
    const [student] = people.students;
    if (!student) throw new Error("Student missing.");

    const both = await own.atOnce(
      (db) => registerCounselling(db, student, SENT, NOW),
      (db) => registerCounselling(db, student, SENT, NOW),
    );

    expect(both.sooner).toEqual({ kind: "kept", done: REGISTERED });
    expect(both.later).toEqual({ kind: "refused", error: STILL_ACTIVE });
    const kept = await own.db
      .select()
      .from(counsellingSchedules)
      .where(eq(counsellingSchedules.studentId, student.studentId ?? ""));
    expect(kept).toHaveLength(1);
    const lines = await own.db
      .select()
      .from(counsellingScheduleChanges)
      .where(eq(counsellingScheduleChanges.scheduleId, kept[0]?.id ?? ""));
    expect(lines).toHaveLength(1);
    const consentLines = await own.db
      .select()
      .from(counsellingConsentChanges)
      .where(eq(counsellingConsentChanges.changedBy, student.id));
    expect(consentLines).toHaveLength(1);
  });
});

// Senin 19 October 2026, 10:00 on campus.
const REGISTERED_AT = new Date("2026-10-19T03:00:00Z");

const PROPOSAL = {
  day: "2026-10-23",
  hour: "14:30",
  way: "online",
  message: null,
};

/** A student with a Diajukan request, as Konselor's card shows it. */
async function submitted(program: string, nim: string) {
  const people = await addTestPeople(own.db, program, [nim]);
  const [student] = people.students;
  if (!student?.studentId) throw new Error("Student missing.");
  const id = await addTestSchedule(own.db, {
    studentId: student.studentId,
    studentAccountId: student.id,
    at: REGISTERED_AT,
  });
  return { ...people, student, id, version: REGISTERED_AT.toISOString() };
}

async function stepsOf(id: string) {
  return own.db
    .select()
    .from(counsellingScheduleChanges)
    .where(eq(counsellingScheduleChanges.scheduleId, id));
}

describe("two Konselor on one request at the same moment", () => {
  it("keep the first change; the other waits, then is refused with the current card", async () => {
    const { counsellor, id, version } = await submitted(
      "Prodi Uji Jadwal Sekaligus 1",
      "9986207002",
    );

    const both = await own.atOnce(
      (db) => approveSchedule(db, counsellor, id, version, NOW),
      (db) => proposeSchedule(db, counsellor, id, version, PROPOSAL, NOW),
    );

    expect(both.sooner).toMatchObject({
      kind: "kept",
      card: { status: "scheduled" },
    });
    expect(both.later).toMatchObject({
      kind: "changed",
      error: SCHEDULE_CHANGED_SINCE,
      card: { status: "scheduled" },
    });
    expect(await stepsOf(id)).toHaveLength(2);
  });
});

describe("Terima jadwal ini and Minta waktu lain at the same moment", () => {
  it("keep the first answer; the other waits, then is refused", async () => {
    const { counsellor, student, id, version } = await submitted(
      "Prodi Uji Jadwal Sekaligus 2",
      "9986207003",
    );
    const proposed = await proposeSchedule(
      own.db,
      counsellor,
      id,
      version,
      PROPOSAL,
      NOW,
    );
    if (proposed.kind !== "kept") throw new Error(proposed.error);
    const shown = proposed.card.version;

    // An hour after the proposal, so the first answer gives a new version.
    const answeredAt = new Date("2026-10-20T04:00:00Z");
    const both = await own.atOnce(
      (db) => acceptSchedule(db, student, id, shown, answeredAt),
      (db) =>
        askAnotherTime(
          db,
          student,
          id,
          shown,
          { day: "2026-10-26", hour: "08:30", reason: null },
          answeredAt,
        ),
    );

    expect(both.sooner).toMatchObject({ kind: "kept" });
    expect(both.later).toEqual({
      kind: "changed",
      error: SCHEDULE_CHANGED_SINCE,
    });
    const [kept] = await own.db
      .select()
      .from(counsellingSchedules)
      .where(eq(counsellingSchedules.id, id));
    expect(kept?.status).toBe("scheduled");
    expect(await stepsOf(id)).toHaveLength(3);
  });
});

describe("the student cancels while Konselor approves, at the same moment", () => {
  it("keeps the first change; the other waits, then sees the current state with a message", async () => {
    const { counsellor, student, id, version } = await submitted(
      "Prodi Uji Jadwal Sekaligus 3",
      "9986207004",
    );

    const both = await own.atOnce<StudentMoveOutcome | CounsellorMoveOutcome>(
      (db) => cancelSchedule(db, student, id, version, NOW),
      (db) => approveSchedule(db, counsellor, id, version, NOW),
    );

    expect(both.sooner).toEqual({ kind: "kept", done: CANCELLED });
    expect(both.later).toMatchObject({
      kind: "changed",
      error: SCHEDULE_CHANGED_SINCE,
      card: { status: "cancelled" },
    });
    expect(await stepsOf(id)).toHaveLength(2);
  });
});

/** A student with a Dijadwalkan session today, as both screens show it. */
async function scheduledToday(program: string, nim: string) {
  const people = await addTestPeople(own.db, program, [nim]);
  const [student] = people.students;
  if (!student?.studentId) throw new Error("Student missing.");
  const id = await addTestSchedule(own.db, {
    studentId: student.studentId,
    studentAccountId: student.id,
    status: "scheduled",
    day: "2026-10-20",
    counsellorId: people.counsellor.id,
    at: REGISTERED_AT,
  });
  return { ...people, student, id, version: REGISTERED_AT.toISOString() };
}

describe("the student cancels while Konselor marks the session, at the same moment", () => {
  it("keeps the first change; the other waits, then sees the current state with a message", async () => {
    const { counsellor, student, id, version } = await scheduledToday(
      "Prodi Uji Jadwal Sekaligus 4",
      "9986207005",
    );

    const both = await own.atOnce<StudentMoveOutcome | CounsellorMoveOutcome>(
      (db) => markScheduleDone(db, counsellor, id, version, NOW),
      (db) => cancelSchedule(db, student, id, version, NOW),
    );

    expect(both.sooner).toMatchObject({
      kind: "kept",
      card: { status: "done" },
    });
    expect(both.later).toEqual({
      kind: "changed",
      error: SCHEDULE_CHANGED_SINCE,
    });
    expect(await stepsOf(id)).toHaveLength(2);
  });
});

describe("the student asks for a new time while Konselor moves the session, at the same moment", () => {
  it("keeps the first change; the other waits, then sees the current card with a message", async () => {
    const { counsellor, student, id, version } = await scheduledToday(
      "Prodi Uji Jadwal Sekaligus 5",
      "9986207006",
    );

    const both = await own.atOnce<StudentMoveOutcome | CounsellorMoveOutcome>(
      (db) =>
        askAnotherTime(
          db,
          student,
          id,
          version,
          { day: "2026-10-26", hour: "08:30", reason: "Bentrok uji." },
          NOW,
        ),
      (db) => rescheduleSchedule(db, counsellor, id, version, PROPOSAL, NOW),
    );

    expect(both.sooner).toMatchObject({ kind: "kept" });
    expect(both.later).toMatchObject({
      kind: "changed",
      error: SCHEDULE_CHANGED_SINCE,
      card: { status: "submitted", day: "2026-10-26" },
    });
    expect(await stepsOf(id)).toHaveLength(2);
  });
});

describe("two Konselor setting the time of one assignment at the same moment", () => {
  it("keep the first time; the other waits, then is refused with the current card", async () => {
    const people = await addTestPeople(
      own.db,
      "Prodi Uji Penugasan Sekaligus",
      ["9986207010"],
    );
    const [studentId] = people.studentIds;
    if (!studentId) throw new Error("Student missing.");
    const sender = await addTestActor(own.db, "Pembina Uji", [
      "discipline_officer",
    ]);
    const id = await addTestAssignment(own.db, {
      studentId,
      senderId: sender.id,
      at: REGISTERED_AT,
    });
    const version = REGISTERED_AT.toISOString();
    const other = { ...PROPOSAL, day: "2026-10-26", hour: "08:30" };

    const both = await own.atOnce(
      (db) =>
        setScheduleTime(db, people.counsellor, id, version, PROPOSAL, NOW),
      (db) => setScheduleTime(db, people.counsellor, id, version, other, NOW),
    );

    expect(both.sooner).toMatchObject({
      kind: "kept",
      card: { status: "scheduled", day: "2026-10-23" },
    });
    expect(both.later).toMatchObject({
      kind: "changed",
      error: SCHEDULE_CHANGED_SINCE,
      card: { status: "scheduled", day: "2026-10-23" },
    });
    expect(await stepsOf(id)).toHaveLength(2);
  });
});
