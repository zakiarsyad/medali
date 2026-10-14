// Sample Tahun akademik of this file: 2420 to 2420.
import { eq, sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { MEETINGS_PER_PERIOD } from "@/mentoring/meeting-ids";
import type { Database } from "./connect";
import {
  academicPeriods,
  accounts,
  mentorGroups,
  mentoringAttendance,
  mentoringMeetingChanges,
  mentoringMeetings,
  students,
  studyPrograms,
} from "./schema";
import { withTestDatabase } from "./test-database";

const inTestDatabase = withTestDatabase();

interface Records {
  groupId: string;
  periodId: string;
  savedBy: string;
  studentId: string;
}

async function addRecords(db: Database): Promise<Records> {
  const [account] = await db
    .insert(accounts)
    .values({ name: "Akun Uji Pertemuan" })
    .returning();
  const [program] = await db
    .insert(studyPrograms)
    .values({ name: "Prodi Uji Pertemuan", code: "UJIPERT" })
    .returning();
  if (!account || !program) throw new Error("The records were not added.");
  const [group] = await db
    .insert(mentorGroups)
    .values({
      studyProgramId: program.id,
      cohortYear: 2420,
      entryPath: "regular",
      number: 1,
      startsOn: "2420-09-01",
    })
    .returning();
  const [period] = await db
    .insert(academicPeriods)
    .values({
      startYear: 2420,
      term: "odd",
      startsOn: "2420-08-01",
      endsOn: "2421-01-31",
    })
    .returning();
  const [student] = await db
    .insert(students)
    .values({
      nim: "UJIPERT001",
      name: "Mahasiswa Uji Pertemuan",
      studyProgramId: program.id,
      entryPath: "regular",
      sex: "female",
      cohortYear: 2420,
    })
    .returning();
  if (!group || !period || !student) {
    throw new Error("The records were not added.");
  }
  return {
    groupId: group.id,
    periodId: period.id,
    savedBy: account.id,
    studentId: student.id,
  };
}

function addMeeting(db: Database, of: Records, number = 1) {
  return db
    .insert(mentoringMeetings)
    .values({
      groupId: of.groupId,
      periodId: of.periodId,
      savedBy: of.savedBy,
      number,
      heldOn: "2420-09-10",
      topic: "Topik uji",
      savedAt: new Date(),
    })
    .returning();
}

async function addLogLine(db: Database): Promise<{ id: string; of: string }> {
  const records = await addRecords(db);
  const [meeting] = await addMeeting(db, records);
  if (!meeting) throw new Error("The meeting was not added.");
  const [line] = await db
    .insert(mentoringMeetingChanges)
    .values({
      meetingId: meeting.id,
      changedBy: records.savedBy,
      heldOnAfter: meeting.heldOn,
      topicAfter: meeting.topic,
      marksAfter: { [records.studentId]: "present" },
    })
    .returning();
  if (!line) throw new Error("The log line was not added.");
  return { id: line.id, of: meeting.id };
}

describe("a mentoring meeting", () => {
  it("is refused a second time for one group, period and number", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      await addMeeting(db, records, 2);

      await expect(addMeeting(db, records, 2)).rejects.toThrow();
    });
  });

  it("takes each number from 1 to the last of a period", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      for (let number = 1; number <= MEETINGS_PER_PERIOD; number += 1) {
        const [meeting] = await addMeeting(db, records, number);

        expect(meeting).toMatchObject({ number, version: 1 });
      }
    });
  });

  it.each([0, MEETINGS_PER_PERIOD + 1])(
    "is refused the number %i, outside those of a period",
    async (number) => {
      await inTestDatabase(async (db) => {
        const records = await addRecords(db);

        await expect(addMeeting(db, records, number)).rejects.toThrow();
      });
    },
  );

  it("keeps one mark for a student at most", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const [meeting] = await addMeeting(db, records);
      if (!meeting) throw new Error("The meeting was not added.");
      const mark = { meetingId: meeting.id, studentId: records.studentId };
      await db.insert(mentoringAttendance).values({ ...mark, mark: "sick" });

      await expect(
        db.insert(mentoringAttendance).values({ ...mark, mark: "present" }),
      ).rejects.toThrow();
    });
  });

  it("cannot be deleted once it has a log line", async () => {
    await inTestDatabase(async (db) => {
      const line = await addLogLine(db);
      const removal = db
        .delete(mentoringMeetings)
        .where(eq(mentoringMeetings.id, line.of));
      await expect(removal).rejects.toThrow();
    });
  });

  it("cannot be emptied, not even together with its log", async () => {
    await inTestDatabase(async (db) => {
      await addLogLine(db);
      await expect(
        db.execute(sql`truncate mentoring_meetings cascade`),
      ).rejects.toThrow();
    });
  });
});

describe("the log of attendance lists", () => {
  it("refuses to change a line", async () => {
    await inTestDatabase(async (db) => {
      const line = await addLogLine(db);
      const change = db
        .update(mentoringMeetingChanges)
        .set({ topicAfter: "Topik lain" })
        .where(eq(mentoringMeetingChanges.id, line.id));
      await expect(change).rejects.toThrow();
    });
  });

  it("refuses to delete a line", async () => {
    await inTestDatabase(async (db) => {
      const line = await addLogLine(db);
      const removal = db
        .delete(mentoringMeetingChanges)
        .where(eq(mentoringMeetingChanges.id, line.id));
      await expect(removal).rejects.toThrow();
    });
  });

  it("refuses to be emptied", async () => {
    await inTestDatabase(async (db) => {
      await addLogLine(db);
      await expect(
        db.execute(sql`truncate mentoring_meeting_changes`),
      ).rejects.toThrow();
    });
  });
});
