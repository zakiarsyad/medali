// Sample NIMs of this file: 9962000200 to 9962000299.
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { AccountForAccess } from "@/auth/access";
import { ROLE_IDS } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { mentorGroups } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { type AttendanceInput, NOT_SAVED_YET } from "./attendance-input";
import {
  GROUP_NOT_HELD,
  MEETING_CHANGED,
  marksExactly,
  NO_RUNNING_PERIOD,
  NO_SUCH_MEETING,
  NOT_ALLOWED_TO_FILL_IN,
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
  addTestProgram,
  addTestStudent,
} from "./test-records";

const inTestDatabase = withTestDatabase();

const OTHER_ROLES = ROLE_IDS.filter((role) => role !== "mentor");

interface Records {
  mentor: AccountForAccess;
  otherMentor: AccountForAccess;
  /** Held the group before the mentor took it. */
  earlierMentor: AccountForAccess;
  groupId: string;
  otherGroupId: string;
  period: TestPeriod;
  /** The two Aktif members of the group. */
  ani: string;
  budi: string;
  /** A member of the group who is on Cuti. */
  onLeave: string;
  /** An Aktif member of the other mentor's group. */
  outsider: string;
}

async function addRecords(db: Database): Promise<Records> {
  const program = await addTestProgram(db, "UJISIMPANHADIR");
  const mentor = await addTestAccount(db, "Pengasuh Uji Hadir", ["mentor"]);
  const otherMentor = await addTestAccount(db, "Pengasuh Uji Hadir Lain", [
    "mentor",
  ]);
  const earlierMentor = await addTestAccount(db, "Pengasuh Uji Hadir Dulu", [
    "mentor",
  ]);
  const ani = await addTestStudent(db, program, {
    nim: "9962000201",
    name: "Ani Uji Hadir",
  });
  const budi = await addTestStudent(db, program, {
    nim: "9962000202",
    name: "Budi Uji Hadir",
  });
  const onLeave = await addTestStudent(db, program, {
    nim: "9962000203",
    name: "Cuti Uji Hadir",
    status: "on_leave",
  });
  const outsider = await addTestStudent(db, program, {
    nim: "9962000204",
    name: "Kelompok Lain Uji Hadir",
  });
  const groupId = await addTestGroup(db, program, {
    number: 1,
    memberIds: [ani, budi, onLeave],
    mentorId: mentor.id,
    earlierMentorId: earlierMentor.id,
  });
  const otherGroupId = await addTestGroup(db, program, {
    number: 2,
    memberIds: [outsider],
    mentorId: otherMentor.id,
  });
  const period = await addTestPeriod(db, 2073);
  return {
    mentor,
    otherMentor,
    earlierMentor,
    groupId,
    otherGroupId,
    period,
    ani,
    budi,
    onLeave,
    outsider,
  };
}

/** A list for meeting 1 of the mentor's group, with a mark for each Aktif member. */
function listOf(
  records: Records,
  more: Partial<AttendanceInput> = {},
): AttendanceInput {
  return {
    groupId: records.groupId,
    number: 1,
    heldOn: "2073-09-10",
    topic: "Orientasi kelompok dan kontrak belajar",
    version: NOT_SAVED_YET,
    marks: { [records.ani]: "present", [records.budi]: "sick" },
    ...more,
  };
}

/** How many meetings the two test groups have together. */
async function savedCount(db: Database, records: Records): Promise<number> {
  const own = await testMeetingsOf(db, records.groupId);
  const other = await testMeetingsOf(db, records.otherGroupId);
  return own.length + other.length;
}

describe("saveAttendance", () => {
  it("keeps the meeting of the running period with its day, its topic and each member's mark", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const { mentor, period } = records;

      const saved = await saveAttendance(
        db,
        mentor,
        listOf(records),
        period.day,
      );

      const [meeting, ...more] = await testMeetingsOf(db, records.groupId);
      expect(saved).toEqual({ ok: true, value: { number: 1, version: 1 } });
      expect(more).toEqual([]);
      expect(meeting).toMatchObject({
        periodId: period.id,
        number: 1,
        heldOn: "2073-09-10",
        topic: "Orientasi kelompok dan kontrak belajar",
        version: 1,
        savedBy: mentor.id,
      });
      expect(await testMarksOf(db, meeting?.id ?? "")).toEqual({
        [records.ani]: "present",
        [records.budi]: "sick",
      });
    });
  });

  it("writes one log line for the first save: who, with nothing before and the list after", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const list = listOf(records);

      await saveAttendance(db, records.mentor, list, records.period.day);

      const [meeting] = await testMeetingsOf(db, records.groupId);
      const lines = await testLogOf(db, meeting?.id ?? "");
      expect(lines).toHaveLength(1);
      expect(lines[0]).toMatchObject({
        changedBy: records.mentor.id,
        heldOnBefore: null,
        topicBefore: null,
        marksBefore: null,
        heldOnAfter: list.heldOn,
        topicAfter: list.topic,
        marksAfter: list.marks,
      });
    });
  });

  it("lets the four meetings be filled in any order, on days that need not follow their numbers", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const { mentor, period } = records;

      for (const [number, heldOn] of [
        [3, "2073-09-20"],
        [1, "2073-10-01"],
        [4, "2073-08-01"],
        [2, period.day],
      ] as const) {
        const saved = await saveAttendance(
          db,
          mentor,
          listOf(records, { number, heldOn }),
          period.day,
        );

        expect(saved.ok).toBe(true);
      }
      const meetings = await testMeetingsOf(db, records.groupId);
      expect(meetings.map((meeting) => meeting.number)).toEqual([1, 2, 3, 4]);
    });
  });

  it.each(OTHER_ROLES)("refuses %s, and saves nothing", async (role) => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const other = await addTestAccount(db, `Akun Uji ${role}`, [role]);

      const saved = await saveAttendance(
        db,
        other,
        listOf(records),
        records.period.day,
      );

      expect(saved).toEqual(NOT_ALLOWED_TO_FILL_IN);
      expect(await savedCount(db, records)).toBe(0);
    });
  });

  it("refuses Pengasuh a group another mentor holds, and saves nothing", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const list = listOf(records, {
        groupId: records.otherGroupId,
        marks: { [records.outsider]: "present" },
      });

      const saved = await saveAttendance(
        db,
        records.mentor,
        list,
        records.period.day,
      );

      expect(saved).toEqual(GROUP_NOT_HELD);
      expect(await savedCount(db, records)).toBe(0);
    });
  });

  it("refuses Pengasuh who is also Kepala Unit a group they do not hold", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const both: AccountForAccess = {
        ...records.otherMentor,
        roles: ["mentor", "head_of_unit"],
      };

      const saved = await saveAttendance(
        db,
        both,
        listOf(records),
        records.period.day,
      );

      expect(saved).toEqual(GROUP_NOT_HELD);
      expect(await savedCount(db, records)).toBe(0);
    });
  });

  it("refuses the mentor who held the group before and was replaced", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      const saved = await saveAttendance(
        db,
        records.earlierMentor,
        listOf(records),
        records.period.day,
      );

      expect(saved).toEqual(GROUP_NOT_HELD);
      expect(await savedCount(db, records)).toBe(0);
    });
  });

  it("gives the same answer for a group that does not exist and for one that is ended", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const { mentor, period } = records;
      const missing = listOf(records, { groupId: randomUUID() });

      expect(await saveAttendance(db, mentor, missing, period.day)).toEqual(
        GROUP_NOT_HELD,
      );

      await db
        .update(mentorGroups)
        .set({ endedAt: new Date(), endedBy: mentor.id })
        .where(eq(mentorGroups.id, records.groupId));

      expect(
        await saveAttendance(db, mentor, listOf(records), period.day),
      ).toEqual(GROUP_NOT_HELD);
      expect(await savedCount(db, records)).toBe(0);
    });
  });

  it("refuses a list with a student who is not in the group, and saves nothing", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const marks = {
        ...listOf(records).marks,
        [records.outsider]: "present" as const,
      };

      const saved = await saveAttendance(
        db,
        records.mentor,
        listOf(records, { marks }),
        records.period.day,
      );

      expect(saved).toEqual(NOT_THE_MEMBERS);
      expect(await savedCount(db, records)).toBe(0);
    });
  });

  it("refuses a list that marks a member on Cuti, who is not listed", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const marks = {
        ...listOf(records).marks,
        [records.onLeave]: "excused" as const,
      };

      const saved = await saveAttendance(
        db,
        records.mentor,
        listOf(records, { marks }),
        records.period.day,
      );

      expect(saved).toEqual(NOT_THE_MEMBERS);
      expect(await savedCount(db, records)).toBe(0);
    });
  });

  it("refuses a list that leaves an Aktif member out", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const marks = { [records.ani]: "present" as const };

      const saved = await saveAttendance(
        db,
        records.mentor,
        listOf(records, { marks }),
        records.period.day,
      );

      expect(saved).toEqual(NOT_THE_MEMBERS);
      expect(await savedCount(db, records)).toBe(0);
    });
  });

  it.each([5, 0, -1, 1.5])(
    "refuses meeting %d: a period has four, and saves nothing",
    async (number) => {
      await inTestDatabase(async (db) => {
        const records = await addRecords(db);

        const saved = await saveAttendance(
          db,
          records.mentor,
          listOf(records, { number }),
          records.period.day,
        );

        expect(saved).toEqual(NO_SUCH_MEETING);
        expect(await savedCount(db, records)).toBe(0);
      });
    },
  );

  it("refuses a day after today, says why, and saves nothing", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      const saved = await saveAttendance(
        db,
        records.mentor,
        listOf(records, { heldOn: "2073-10-14" }),
        records.period.day,
      );

      expect(saved.ok).toBe(false);
      expect(!saved.ok && saved.error).toContain("setelah hari ini");
      expect(await savedCount(db, records)).toBe(0);
    });
  });

  it("refuses a day before the running period, says why, and saves nothing", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      const saved = await saveAttendance(
        db,
        records.mentor,
        listOf(records, { heldOn: "2073-07-31" }),
        records.period.day,
      );

      expect(saved.ok).toBe(false);
      expect(!saved.ok && saved.error).toContain("semester berjalan");
      expect(await savedCount(db, records)).toBe(0);
    });
  });

  it("refuses every list while no period is running", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const beforeEveryPeriod = "1990-01-01";

      const saved = await saveAttendance(
        db,
        records.mentor,
        listOf(records, { heldOn: beforeEveryPeriod }),
        beforeEveryPeriod,
      );

      expect(saved).toEqual(NO_RUNNING_PERIOD);
      expect(await savedCount(db, records)).toBe(0);
    });
  });

  it("keeps one list when Simpan daftar hadir is pressed twice: the second press is told the meeting changed", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const { mentor, period } = records;
      const list = listOf(records);

      const first = await saveAttendance(db, mentor, list, period.day);
      const second = await saveAttendance(db, mentor, list, period.day);

      const meetings = await testMeetingsOf(db, records.groupId);
      expect(first.ok).toBe(true);
      expect(second).toEqual(MEETING_CHANGED);
      expect(meetings).toHaveLength(1);
      expect(meetings[0]?.version).toBe(1);
      expect(await testLogOf(db, meetings[0]?.id ?? "")).toHaveLength(1);
    });
  });

  it("refuses a first list from a window that was opened before another window saved one, and keeps that one", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const { mentor, period } = records;
      await saveAttendance(db, mentor, listOf(records), period.day);

      const fromOtherWindow = await saveAttendance(
        db,
        mentor,
        listOf(records, {
          topic: "Topik jendela kedua",
          marks: { [records.ani]: "absent", [records.budi]: "absent" },
        }),
        period.day,
      );

      const [meeting] = await testMeetingsOf(db, records.groupId);
      expect(fromOtherWindow).toEqual(MEETING_CHANGED);
      expect(meeting?.topic).toBe("Orientasi kelompok dan kontrak belajar");
      expect(await testMarksOf(db, meeting?.id ?? "")).toEqual({
        [records.ani]: "present",
        [records.budi]: "sick",
      });
    });
  });

  it("refuses a form that says it was opened on a list no meeting has yet", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      const saved = await saveAttendance(
        db,
        records.mentor,
        listOf(records, { version: 3 }),
        records.period.day,
      );

      expect(saved).toEqual(MEETING_CHANGED);
      expect(await savedCount(db, records)).toBe(0);
    });
  });
});

describe("marksExactly", () => {
  it("takes a list with a mark for each member and nobody else", () => {
    expect(marksExactly({ a: "present", b: "absent" }, ["b", "a"])).toBe(true);
    expect(marksExactly({}, [])).toBe(true);
  });

  it("refuses a list with someone else, with a member left out, or with one in place of another", () => {
    expect(marksExactly({ a: "present", c: "sick" }, ["a"])).toBe(false);
    expect(marksExactly({ a: "present" }, ["a", "b"])).toBe(false);
    expect(marksExactly({ a: "present", c: "sick" }, ["a", "b"])).toBe(false);
  });
});
