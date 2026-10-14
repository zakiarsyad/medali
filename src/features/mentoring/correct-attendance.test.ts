// Sample Tahun akademik of this file: 2630 to 2630.
// Sample NIMs of this file: 9962000400 to 9962000499.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { AccountForAccess } from "@/auth/access";
import type { Database } from "@/db/connect";
import { mentorGroupMembers, students } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import type { AttendanceInput } from "./attendance-input";
import { listActiveMembers, readMarks, readMeetings } from "./group-meetings";
import { meetingsOverview } from "./meetings-overview";
import {
  MEETING_CHANGED,
  NOT_THE_MEMBERS,
  saveAttendance,
} from "./save-attendance";
import {
  addTestPeriod,
  type TestPeriod,
  testLogOf,
  testMarksOf,
  testMeetingsOf,
} from "./test-meetings";
import {
  addTestAccount,
  addTestGroup,
  addTestMembers,
  addTestProgram,
  addTestStudent,
  replaceTestMentor,
} from "./test-records";

const inTestDatabase = withTestDatabase();

const FIRST_TOPIC = "Orientasi kelompok dan kontrak belajar";

interface Records {
  program: number;
  mentor: AccountForAccess;
  groupId: string;
  period: TestPeriod;
  /** The two Aktif members of the group. */
  ani: string;
  budi: string;
  /** The meeting 1 the mentor saved: Ani Hadir, Budi Sakit. */
  meetingId: string;
}

function listOf(
  records: Pick<Records, "groupId" | "ani" | "budi">,
  more: Partial<AttendanceInput> = {},
): AttendanceInput {
  return {
    groupId: records.groupId,
    number: 1,
    heldOn: "2630-09-10",
    topic: FIRST_TOPIC,
    version: 0,
    marks: { [records.ani]: "present", [records.budi]: "sick" },
    ...more,
  };
}

/** A group with two members, whose mentor has saved meeting 1 once. */
async function addRecords(db: Database): Promise<Records> {
  const program = await addTestProgram(db, "UJIUBAHHADIR");
  const mentor = await addTestAccount(db, "Pengasuh Uji Ubah", ["mentor"]);
  const ani = await addTestStudent(db, program, {
    nim: "9962000401",
    name: "Ani Uji Ubah",
  });
  const budi = await addTestStudent(db, program, {
    nim: "9962000402",
    name: "Budi Uji Ubah",
  });
  const groupId = await addTestGroup(db, program, {
    number: 1,
    memberIds: [ani, budi],
    mentorId: mentor.id,
  });
  const period = await addTestPeriod(db, 2630);
  const first = listOf({ groupId, ani, budi });
  const saved = await saveAttendance(db, mentor, first, period.day);
  if (!saved.ok) throw new Error("The first list was not saved.");
  const [meeting] = await testMeetingsOf(db, groupId);
  if (!meeting) throw new Error("The first list was not saved.");
  return {
    program,
    mentor,
    groupId,
    period,
    ani,
    budi,
    meetingId: meeting.id,
  };
}

/** Adds an Aktif member to the group, after its meeting 1 was saved. */
async function addNewMember(db: Database, records: Records): Promise<string> {
  const citra = await addTestStudent(db, records.program, {
    nim: "9962000403",
    name: "Citra Uji Ubah",
  });
  await addTestMembers(db, records.groupId, [citra]);
  return citra;
}

/** "Rerata kehadiran pengasuhan" of the group, as the tab works it out. */
async function averageOf(
  db: Database,
  records: Records,
): Promise<number | null> {
  const members = await listActiveMembers(db, records.groupId);
  const meetings = await readMeetings(db, records.groupId, records.period.id);
  const marks = await readMarks(
    db,
    meetings.map((meeting) => meeting.id),
  );
  const memberIds = members.map((member) => member.id);
  return meetingsOverview(memberIds, meetings, marks).average;
}

describe("Ubah daftar hadir", () => {
  it("puts the new list in the place of the old one", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const changed = listOf(records, {
        heldOn: "2630-09-12",
        topic: "Topik yang diperbaiki",
        version: 1,
        marks: { [records.ani]: "absent", [records.budi]: "present" },
      });

      const saved = await saveAttendance(
        db,
        records.mentor,
        changed,
        records.period.day,
      );

      const meetings = await testMeetingsOf(db, records.groupId);
      expect(saved).toEqual({ ok: true, value: { number: 1, version: 2 } });
      expect(meetings).toHaveLength(1);
      expect(meetings[0]).toMatchObject({
        id: records.meetingId,
        heldOn: "2630-09-12",
        topic: "Topik yang diperbaiki",
        version: 2,
      });
      expect(await testMarksOf(db, records.meetingId)).toEqual({
        [records.ani]: "absent",
        [records.budi]: "present",
      });
    });
  });

  it("keeps who changed what in the log: the day, the topic and every mark before and after", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const changed = listOf(records, {
        heldOn: "2630-09-12",
        topic: "Topik yang diperbaiki",
        version: 1,
        marks: { [records.ani]: "absent", [records.budi]: "sick" },
      });

      await saveAttendance(db, records.mentor, changed, records.period.day);

      const lines = await testLogOf(db, records.meetingId);
      expect(lines).toHaveLength(2);
      expect(lines[1]).toMatchObject({
        changedBy: records.mentor.id,
        heldOnBefore: "2630-09-10",
        topicBefore: FIRST_TOPIC,
        marksBefore: { [records.ani]: "present", [records.budi]: "sick" },
        heldOnAfter: "2630-09-12",
        topicAfter: "Topik yang diperbaiki",
        marksAfter: { [records.ani]: "absent", [records.budi]: "sick" },
      });
      expect(lines[1]?.changedAt.getTime()).toBeGreaterThanOrEqual(
        lines[0]?.changedAt.getTime() ?? Number.POSITIVE_INFINITY,
      );
    });
  });

  it("writes nothing for a save that changes nothing: no new version, no log line", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const same = listOf(records, { version: 1 });

      const saved = await saveAttendance(
        db,
        records.mentor,
        same,
        records.period.day,
      );

      const [meeting] = await testMeetingsOf(db, records.groupId);
      expect(saved).toEqual({ ok: true, value: { number: 1, version: 1 } });
      expect(meeting?.version).toBe(1);
      expect(await testLogOf(db, records.meetingId)).toHaveLength(1);
    });
  });

  it("refuses a change from a window opened before another window changed the list, and tells it the meeting changed", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const { mentor, period } = records;
      const fromFirstWindow = listOf(records, {
        version: 1,
        marks: { [records.ani]: "excused", [records.budi]: "sick" },
      });
      const fromSecondWindow = listOf(records, {
        version: 1,
        topic: "Topik jendela kedua",
        marks: { [records.ani]: "absent", [records.budi]: "absent" },
      });

      const first = await saveAttendance(
        db,
        mentor,
        fromFirstWindow,
        period.day,
      );
      const second = await saveAttendance(
        db,
        mentor,
        fromSecondWindow,
        period.day,
      );

      const [meeting] = await testMeetingsOf(db, records.groupId);
      expect(first).toEqual({ ok: true, value: { number: 1, version: 2 } });
      expect(second).toEqual(MEETING_CHANGED);
      expect(meeting).toMatchObject({ topic: FIRST_TOPIC, version: 2 });
      expect(await testMarksOf(db, records.meetingId)).toEqual({
        [records.ani]: "excused",
        [records.budi]: "sick",
      });
      expect(await testLogOf(db, records.meetingId)).toHaveLength(2);
    });
  });

  it("lets the second window change the list once it has loaded the page again", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const { mentor, period } = records;
      const marks = {
        [records.ani]: "excused",
        [records.budi]: "sick",
      } as const;
      await saveAttendance(
        db,
        mentor,
        listOf(records, { version: 1, marks }),
        period.day,
      );

      const reloaded = await saveAttendance(
        db,
        mentor,
        listOf(records, { version: 2, topic: "Topik jendela kedua", marks }),
        period.day,
      );

      expect(reloaded).toEqual({ ok: true, value: { number: 1, version: 3 } });
    });
  });

  it("lets the new mentor change a list the earlier mentor filled in, and the log shows who", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const newMentor = await addTestAccount(db, "Pengasuh Uji Pengganti", [
        "mentor",
      ]);
      await replaceTestMentor(db, records.groupId, newMentor.id, "2630-10-01");
      const changed = listOf(records, { version: 1, topic: "Topik pengganti" });

      const byNew = await saveAttendance(
        db,
        newMentor,
        changed,
        records.period.day,
      );
      const byEarlier = await saveAttendance(
        db,
        records.mentor,
        listOf(records, { version: 2, topic: "Topik pengasuh lama" }),
        records.period.day,
      );

      const lines = await testLogOf(db, records.meetingId);
      expect(byNew.ok).toBe(true);
      expect(byEarlier.ok).toBe(false);
      expect(lines.map((line) => line.changedBy)).toEqual([
        records.mentor.id,
        newMentor.id,
      ]);
      expect(lines[1]?.topicAfter).toBe("Topik pengganti");
    });
  });

  it("leaves a member who joined after the list was saved without a mark when only the topic is corrected, and the average stays", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const { mentor, period } = records;
      const averageBefore = await averageOf(db, records);
      await addNewMember(db, records);

      const saved = await saveAttendance(
        db,
        mentor,
        listOf(records, { version: 1, topic: "Topik lain" }),
        period.day,
      );

      const kept = { [records.ani]: "present", [records.budi]: "sick" };
      const lines = await testLogOf(db, records.meetingId);
      expect(saved).toEqual({ ok: true, value: { number: 1, version: 2 } });
      expect(await testMarksOf(db, records.meetingId)).toEqual(kept);
      expect(lines[1]?.marksAfter).toEqual(kept);
      expect(averageBefore).toBe(100);
      expect(await averageOf(db, records)).toBe(100);
    });
  });

  it("writes nothing when a member who joined later is left without a mark and nothing else changed", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      await addNewMember(db, records);

      const saved = await saveAttendance(
        db,
        records.mentor,
        listOf(records, { version: 1 }),
        records.period.day,
      );

      expect(saved).toEqual({ ok: true, value: { number: 1, version: 1 } });
      expect(await testLogOf(db, records.meetingId)).toHaveLength(1);
    });
  });

  it("keeps the mark the mentor picks for a member who joined after the list was saved, and then asks one for them", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const { mentor, period } = records;
      const citra = await addNewMember(db, records);
      const withNewMember = {
        [records.ani]: "present",
        [records.budi]: "sick",
        [citra]: "absent",
      } as const;

      const withThem = await saveAttendance(
        db,
        mentor,
        listOf(records, { version: 1, marks: withNewMember }),
        period.day,
      );
      const withoutThem = await saveAttendance(
        db,
        mentor,
        listOf(records, { version: 2, topic: "Topik lain" }),
        period.day,
      );

      expect(withThem).toEqual({ ok: true, value: { number: 1, version: 2 } });
      expect(withoutThem).toEqual(NOT_THE_MEMBERS);
      expect(await testMarksOf(db, records.meetingId)).toEqual(withNewMember);
      expect(await averageOf(db, records)).toBe(50);
    });
  });

  it("tells a window opened with a member on Tidak tercatat that the meeting changed, once another window saved a mark for them", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const { mentor, period } = records;
      const citra = await addNewMember(db, records);
      const withNewMember = {
        [records.ani]: "present",
        [records.budi]: "sick",
        [citra]: "excused",
      } as const;

      const fromSecondWindow = await saveAttendance(
        db,
        mentor,
        listOf(records, { version: 1, marks: withNewMember }),
        period.day,
      );
      const fromFirstWindow = await saveAttendance(
        db,
        mentor,
        listOf(records, { version: 1, topic: "Topik jendela pertama" }),
        period.day,
      );

      expect(fromSecondWindow.ok).toBe(true);
      expect(fromFirstWindow).toEqual(MEETING_CHANGED);
      expect(await testMarksOf(db, records.meetingId)).toEqual(withNewMember);
      expect(await testLogOf(db, records.meetingId)).toHaveLength(2);
    });
  });

  it("refuses a list that leaves out a member who has a mark, or marks a student outside the group, also beside a member without a mark", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const { mentor, period } = records;
      await addNewMember(db, records);
      const outsider = await addTestStudent(db, records.program, {
        nim: "9962000404",
        name: "Luar Uji Ubah",
      });
      const withOutsider = {
        [records.ani]: "present",
        [records.budi]: "sick",
        [outsider]: "present",
      } as const;

      const withoutBudi = await saveAttendance(
        db,
        mentor,
        listOf(records, { version: 1, marks: { [records.ani]: "absent" } }),
        period.day,
      );
      const withStranger = await saveAttendance(
        db,
        mentor,
        listOf(records, { version: 1, marks: withOutsider }),
        period.day,
      );

      expect(withoutBudi).toEqual(NOT_THE_MEMBERS);
      expect(withStranger).toEqual(NOT_THE_MEMBERS);
      expect(await testLogOf(db, records.meetingId)).toHaveLength(1);
    });
  });

  it("keeps the mark of a student who has left the group or is no longer Aktif as it was saved", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const { mentor, period } = records;
      await db
        .delete(mentorGroupMembers)
        .where(eq(mentorGroupMembers.studentId, records.budi));

      const saved = await saveAttendance(
        db,
        mentor,
        listOf(records, { version: 1, marks: { [records.ani]: "absent" } }),
        period.day,
      );

      const lines = await testLogOf(db, records.meetingId);
      const kept = { [records.ani]: "absent", [records.budi]: "sick" };
      expect(saved.ok).toBe(true);
      expect(await testMarksOf(db, records.meetingId)).toEqual(kept);
      expect(lines[1]?.marksAfter).toEqual(kept);

      await db
        .update(students)
        .set({ status: "on_leave" })
        .where(eq(students.id, records.ani));
      const afterLeave = await saveAttendance(
        db,
        mentor,
        listOf(records, { version: 2, topic: "Topik lain", marks: {} }),
        period.day,
      );

      expect(afterLeave.ok).toBe(true);
      expect(await testMarksOf(db, records.meetingId)).toEqual(kept);
    });
  });
});
