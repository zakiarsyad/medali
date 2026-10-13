// Sample NIMs of this file: 9962000500 to 9962000599.
import { describe, expect, it } from "vitest";
import type { AccountForAccess } from "@/auth/access";
import { withOwnTestDatabase } from "@/db/test-database-at-once";
import type { AttendanceInput } from "./attendance-input";
import { MEETING_CHANGED, saveAttendance } from "./save-attendance";
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

/*
 * Two saves at the same moment need two connections that both see the
 * saved list, and the log of attendance lists cannot be emptied. So these
 * checks have a database of their own, dropped at the end, and each uses
 * a group of its own.
 */
const own = withOwnTestDatabase("hadir");

interface Records {
  mentor: AccountForAccess;
  groupId: string;
  memberId: string;
  period: TestPeriod;
}

let period: TestPeriod | undefined;

/** A group with one member and its mentor. `place` tells the groups apart. */
async function addRecords(place: number): Promise<Records> {
  period ??= await addTestPeriod(own.db, 2075);
  const program = await addTestProgram(own.db, `UJIHADIRSEKALIGUS-${place}`);
  const mentor = await addTestAccount(own.db, `Pengasuh Sekaligus ${place}`, [
    "mentor",
  ]);
  const memberId = await addTestStudent(own.db, program, {
    nim: `996200050${place}`,
    name: `Anak Asuh Sekaligus ${place}`,
  });
  const groupId = await addTestGroup(own.db, program, {
    number: 1,
    memberIds: [memberId],
    mentorId: mentor.id,
  });
  return { mentor, groupId, memberId, period };
}

function listOf(
  records: Records,
  more: Partial<AttendanceInput> = {},
): AttendanceInput {
  return {
    groupId: records.groupId,
    number: 1,
    heldOn: "2075-09-10",
    topic: "Orientasi kelompok dan kontrak belajar",
    version: 0,
    marks: { [records.memberId]: "present" },
    ...more,
  };
}

describe("Simpan daftar hadir sent twice at the same moment", () => {
  it("keeps one list for two presses of a new meeting: the second waits, then is told the meeting changed", async () => {
    const records = await addRecords(1);
    const { mentor } = records;
    const list = listOf(records);

    const both = await own.atOnce(
      (db) => saveAttendance(db, mentor, list, records.period.day),
      (db) => saveAttendance(db, mentor, list, records.period.day),
    );

    const meetings = await testMeetingsOf(own.db, records.groupId);
    expect(both.sooner).toEqual({ ok: true, value: { number: 1, version: 1 } });
    expect(both.later).toEqual(MEETING_CHANGED);
    expect(meetings).toHaveLength(1);
    expect(await testLogOf(own.db, meetings[0]?.id ?? "")).toHaveLength(1);
  });

  it("keeps the list of the first of two windows that change one saved meeting, and tells the second the meeting changed", async () => {
    const records = await addRecords(2);
    const { mentor } = records;
    const day = records.period.day;
    await saveAttendance(own.db, mentor, listOf(records), day);
    const fromFirstWindow = listOf(records, {
      version: 1,
      topic: "Topik jendela pertama",
      marks: { [records.memberId]: "sick" },
    });
    const fromSecondWindow = listOf(records, {
      version: 1,
      topic: "Topik jendela kedua",
      marks: { [records.memberId]: "absent" },
    });

    const both = await own.atOnce(
      (db) => saveAttendance(db, mentor, fromFirstWindow, day),
      (db) => saveAttendance(db, mentor, fromSecondWindow, day),
    );

    const [meeting, ...more] = await testMeetingsOf(own.db, records.groupId);
    expect(both.sooner).toEqual({ ok: true, value: { number: 1, version: 2 } });
    expect(both.later).toEqual(MEETING_CHANGED);
    expect(more).toEqual([]);
    expect(meeting).toMatchObject({
      topic: "Topik jendela pertama",
      version: 2,
    });
    expect(await testMarksOf(own.db, meeting?.id ?? "")).toEqual({
      [records.memberId]: "sick",
    });
    expect(await testLogOf(own.db, meeting?.id ?? "")).toHaveLength(2);
  });
});
