// Sample Tahun akademik of this file: 2640 to 2641.
// Sample NIMs of this file: 9962000100 to 9962000199.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import { students } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { listActiveMembers, readMarks, readMeetings } from "./group-meetings";
import {
  addTestMeeting,
  addTestPeriod,
  type TestPeriod,
} from "./test-meetings";
import {
  addTestAccount,
  addTestGroup,
  addTestProgram,
  addTestStudent,
} from "./test-records";

const inTestDatabase = withTestDatabase();

interface Records {
  mentorId: string;
  groupId: string;
  otherGroupId: string;
  period: TestPeriod;
  /** Aktif members of the group, by name: Ani, then Budi. */
  ani: string;
  budi: string;
  onLeave: string;
  inactive: string;
  removed: string;
}

async function addRecords(db: Database): Promise<Records> {
  const program = await addTestProgram(db, "UJIPERTEMUANKELOMPOK");
  const mentor = await addTestAccount(db, "Pengasuh Uji Pertemuan", ["mentor"]);
  const budi = await addTestStudent(db, program, {
    nim: "9962000102",
    name: "Budi Uji Pertemuan",
    className: "2-01",
  });
  const ani = await addTestStudent(db, program, {
    nim: "9962000101",
    name: "Ani Uji Pertemuan",
  });
  const onLeave = await addTestStudent(db, program, {
    nim: "9962000103",
    name: "Cuti Uji Pertemuan",
    status: "on_leave",
  });
  const inactive = await addTestStudent(db, program, {
    nim: "9962000104",
    name: "Nonaktif Uji Pertemuan",
    status: "inactive",
  });
  const removed = await addTestStudent(db, program, {
    nim: "9962000105",
    name: "Dihapus Uji Pertemuan",
  });
  await db
    .update(students)
    .set({ deletedAt: new Date(), deletedBy: mentor.id })
    .where(eq(students.id, removed));
  const other = await addTestStudent(db, program, {
    nim: "9962000106",
    name: "Kelompok Lain Uji Pertemuan",
  });
  const groupId = await addTestGroup(db, program, {
    number: 1,
    memberIds: [budi, ani, onLeave, inactive, removed],
    mentorId: mentor.id,
  });
  const otherGroupId = await addTestGroup(db, program, {
    number: 2,
    memberIds: [other],
    mentorId: mentor.id,
  });
  const period = await addTestPeriod(db, 2641);
  return {
    mentorId: mentor.id,
    groupId,
    otherGroupId,
    period,
    ani,
    budi,
    onLeave,
    inactive,
    removed,
  };
}

describe("listActiveMembers", () => {
  it("lists the Aktif members of the group by name, with NIM and kelas akademik", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      const members = await listActiveMembers(db, records.groupId);

      expect(members).toEqual([
        {
          id: records.ani,
          name: "Ani Uji Pertemuan",
          nim: "9962000101",
          className: null,
        },
        {
          id: records.budi,
          name: "Budi Uji Pertemuan",
          nim: "9962000102",
          className: "2-01",
        },
      ]);
    });
  });

  it("leaves out a member on Cuti, one who is Non aktif and one who was removed", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      const ids = (await listActiveMembers(db, records.groupId)).map(
        (member) => member.id,
      );

      expect(ids).not.toContain(records.onLeave);
      expect(ids).not.toContain(records.inactive);
      expect(ids).not.toContain(records.removed);
    });
  });
});

describe("readMeetings and readMarks", () => {
  it("give the saved meetings of the group in the period, by number, with their marks", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const { groupId, mentorId: savedBy, period } = records;
      const of = { groupId, periodId: period.id, savedBy };
      const third = await addTestMeeting(
        db,
        { ...of, number: 3, heldOn: "2641-09-20", topic: "Topik tiga" },
        { [records.ani]: "present", [records.budi]: "sick" },
      );
      const first = await addTestMeeting(db, { ...of, number: 1 });

      const meetings = await readMeetings(db, groupId, period.id);
      const marks = await readMarks(db, [first, third]);

      expect(meetings).toEqual([
        expect.objectContaining({ id: first, number: 1, version: 1 }),
        {
          id: third,
          number: 3,
          heldOn: "2641-09-20",
          topic: "Topik tiga",
          version: 1,
        },
      ]);
      expect(marks).toHaveLength(2);
      expect(marks).toContainEqual({
        meetingId: third,
        studentId: records.budi,
        mark: "sick",
      });
    });
  });

  it("leave out the meetings of another group and of another period", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const { groupId, otherGroupId, mentorId: savedBy, period } = records;
      const earlier = await addTestPeriod(db, 2640);
      await addTestMeeting(db, {
        groupId: otherGroupId,
        periodId: period.id,
        number: 1,
        savedBy,
      });
      await addTestMeeting(db, {
        groupId,
        periodId: earlier.id,
        number: 1,
        savedBy,
      });

      expect(await readMeetings(db, groupId, period.id)).toEqual([]);
    });
  });

  it("read no mark when there is no meeting", async () => {
    await inTestDatabase(async (db) => {
      expect(await readMarks(db, [])).toEqual([]);
    });
  });
});
