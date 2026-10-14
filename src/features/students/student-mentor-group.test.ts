// Sample NIMs of this file: 9900001900 to 9900001999.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { accounts } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import {
  type MentorGroupLine,
  mentorGroupOf,
  readStudentMentorGroup,
} from "./student-mentor-group";
import {
  addTestActor,
  addTestMentorGroup,
  addTestProgram,
  addTestStudent,
} from "./test-records";

const inTestDatabase = withTestDatabase();

const GROUP = {
  id: "00000000-0000-4000-8000-000000000001",
  studyProgramId: 7,
  cohortYear: 2026,
  entryPath: "regular",
  number: 1,
  programCode: "D3PJK",
} as const;

const MENTOR_ID = "00000000-0000-4000-8000-000000000002";
const EARLIER_ID = "00000000-0000-4000-8000-000000000003";

const NO_MENTOR = {
  mentorId: null,
  mentorName: null,
  mentorTitle: null,
  startsOn: null,
  endsOn: null,
};

function line(mentor: Partial<MentorGroupLine>): MentorGroupLine {
  return { ...GROUP, ...NO_MENTOR, ...mentor };
}

describe("mentorGroupOf", () => {
  it("gives no group for a student who is in none", () => {
    expect(mentorGroupOf([])).toBeNull();
  });

  it("names the mentor of today and since when", () => {
    const lines = [
      line({
        mentorId: MENTOR_ID,
        mentorName: "Sari Uji",
        mentorTitle: "M.Si.",
        startsOn: "2026-09-01",
      }),
    ];

    expect(mentorGroupOf(lines)).toEqual({
      ...GROUP,
      mentorId: MENTOR_ID,
      mentor: { name: "Sari Uji", title: "M.Si.", since: "2026-09-01" },
      earlierMentors: [],
    });
  });

  it("names the mentors before, apart from the mentor of today", () => {
    const lines = [
      line({
        mentorId: EARLIER_ID,
        mentorName: "Awal Uji",
        startsOn: "2026-09-01",
        endsOn: "2026-09-30",
      }),
      line({
        mentorId: EARLIER_ID,
        mentorName: "Tengah Uji",
        startsOn: "2026-10-01",
        endsOn: "2026-10-31",
      }),
      line({
        mentorId: MENTOR_ID,
        mentorName: "Kini Uji",
        startsOn: "2026-11-01",
      }),
    ];

    expect(mentorGroupOf(lines)).toEqual({
      ...GROUP,
      mentorId: MENTOR_ID,
      mentor: { name: "Kini Uji", title: null, since: "2026-11-01" },
      earlierMentors: ["Awal Uji", "Tengah Uji"],
    });
  });

  it("gives no mentor for a group whose every mentor line has ended", () => {
    const lines = [
      line({
        mentorId: EARLIER_ID,
        mentorName: "Awal Uji",
        startsOn: "2026-09-01",
        endsOn: "2026-09-30",
      }),
    ];

    expect(mentorGroupOf(lines)).toEqual({
      ...GROUP,
      mentorId: null,
      mentor: null,
      earlierMentors: ["Awal Uji"],
    });
  });

  it("gives no mentor for a group that never had one", () => {
    expect(mentorGroupOf([line({})])).toEqual({
      ...GROUP,
      mentorId: null,
      mentor: null,
      earlierMentors: [],
    });
  });
});

describe("readStudentMentorGroup", () => {
  it("reads the group of a student with its mentor and the one before", async () => {
    await inTestDatabase(async (db) => {
      const program = await addTestProgram(db, "UJIKP");
      const studentId = await addTestStudent(db, program, {
        nim: "9900001901",
        name: "Kelompok Uji Ani",
      });
      const mentor = await addTestActor(db, "Kini Uji", ["mentor"]);
      const earlier = await addTestActor(db, "Awal Uji", ["mentor"]);
      await db
        .update(accounts)
        .set({ title: "M.Si." })
        .where(eq(accounts.id, mentor.id));
      const groupId = await addTestMentorGroup(db, program, {
        number: 3,
        memberIds: [studentId],
        mentorId: mentor.id,
        earlierMentorId: earlier.id,
      });

      expect(await readStudentMentorGroup(db, studentId)).toEqual({
        id: groupId,
        studyProgramId: program,
        cohortYear: 2026,
        entryPath: "regular",
        number: 3,
        programCode: "UJIKP",
        mentorId: mentor.id,
        mentor: { name: "Kini Uji", title: "M.Si.", since: "2026-10-01" },
        earlierMentors: ["Awal Uji"],
      });
    });
  });

  it("gives no group for a student outside every group", async () => {
    await inTestDatabase(async (db) => {
      const program = await addTestProgram(db, "UJIKP");
      const member = await addTestStudent(db, program, {
        nim: "9900001902",
        name: "Kelompok Uji Budi",
      });
      const outside = await addTestStudent(db, program, {
        nim: "9900001903",
        name: "Kelompok Uji Cici",
      });
      const mentor = await addTestActor(db, "Kini Uji", ["mentor"]);
      await addTestMentorGroup(db, program, {
        number: 1,
        memberIds: [member],
        mentorId: mentor.id,
      });

      expect(await readStudentMentorGroup(db, outside)).toBeNull();
    });
  });
});
