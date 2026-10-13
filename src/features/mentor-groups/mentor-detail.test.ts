import { inArray } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { RowLimit } from "@/auth/access";
import type { Database } from "@/db/connect";
import { students } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { groupCode } from "@/ui/group-code";
import { type MentorDetail, readMentor } from "./mentor-detail";
import {
  addTestEndedGroup,
  addTestGroup,
  addTestMembers,
  addTestMentor,
  addTestMentorLine,
  addTestMentorRole,
  addTestProgram,
  addTestRoleTaken,
  addTestStudent,
  TEST_GROUP_STARTS_ON,
} from "./test-records";

const inTestDatabase = withTestDatabase();

const EVERYONE: RowLimit = { kind: "all" };

function onlyPrograms(studyProgramIds: number[]): RowLimit {
  return { kind: "some", studyProgramIds, menteesOf: [], studentIds: [] };
}

async function found(
  db: Database,
  limit: RowLimit,
  id: string,
): Promise<MentorDetail> {
  const answer = await readMentor(db, limit, id, null);
  if (answer.kind !== "found") throw new Error("The mentor was not found.");
  return answer.mentor;
}

/**
 * A mentor who holds a 2025 group of one program and a 2024 group of
 * another, and held a third group of the first program before.
 */
async function addBusyMentor(db: Database) {
  const program = await addTestProgram(db, "UJIPGSATU");
  const other = await addTestProgram(db, "UJIPGDUA");
  const id = await addTestMentor(db, {
    name: "Pengasuh Uji Rinci",
    title: "M.Si.",
    unit: "Unit Uji",
    nip: "990000000000000002",
  });
  await addTestMentorRole(db, id);
  const own = await addTestGroup(db, program, { cohortYear: 2025 });
  const foreign = await addTestGroup(db, other, { cohortYear: 2024 });
  const past = await addTestGroup(db, program, { cohortYear: 2023 });
  await addTestMentorLine(db, own, id, { startsOn: "2026-10-01" });
  await addTestMentorLine(db, foreign, id);
  await addTestMentorLine(db, past, id, {
    startsOn: "2025-09-01",
    endsOn: "2026-08-31",
    endReason: "Uji penggantian",
  });
  const rows = [
    { nim: "9900020002", name: "Binaan Uji Budi", className: "3-02" },
    { nim: "9900020001", name: "Binaan Uji Ani", cohortYear: 2025 },
    { nim: "9900020003", name: "Binaan Uji Cuti", status: "on_leave" },
    { nim: "9900020004", name: "Binaan Uji Nonaktif", status: "inactive" },
    { nim: "9900020005", name: "Binaan Uji Dihapus", deletedAt: new Date() },
  ] as const;
  const studentIds: string[] = [];
  for (const row of rows) {
    studentIds.push(await addTestStudent(db, program, row));
  }
  await addTestMembers(db, own, studentIds);
  const elsewhere = await addTestStudent(db, other, {
    nim: "9900020006",
    name: "Binaan Uji Tetangga",
  });
  await addTestMembers(db, foreign, [elsewhere]);
  const former = await addTestStudent(db, program, {
    nim: "9900020007",
    name: "Binaan Uji Dulu",
  });
  await addTestMembers(db, past, [former]);
  return { id, program, other, own, foreign, past, studentIds, elsewhere };
}

describe("readMentor", () => {
  it("gives what the page of a mentor shows", async () => {
    await inTestDatabase(async (db) => {
      const { id, own, foreign, past, studentIds, elsewhere } =
        await addBusyMentor(db);

      const answer = await readMentor(db, EVERYONE, id, null);

      const ownCode = {
        cohortYear: 2025,
        entryPath: "regular",
        number: 1,
        programCode: "UJIPGSATU",
      };
      const foreignCode = {
        ...ownCode,
        cohortYear: 2024,
        programCode: "UJIPGDUA",
      };
      expect(answer).toEqual({
        kind: "found",
        mentor: {
          id,
          name: "Pengasuh Uji Rinci",
          title: "M.Si.",
          unit: "Unit Uji",
          status: "mentoring",
          inactiveSince: null,
          inactiveReason: null,
          students: 3,
          groups: [
            { id: own, mentorId: id, members: 2, ...ownCode },
            { id: foreign, mentorId: id, members: 1, ...foreignCode },
          ],
          assignments: [
            {
              id: expect.any(String),
              groupId: own,
              startsOn: "2026-10-01",
              endsOn: null,
              endReason: null,
              ...ownCode,
            },
            {
              id: expect.any(String),
              groupId: foreign,
              startsOn: TEST_GROUP_STARTS_ON,
              endsOn: null,
              endReason: null,
              ...foreignCode,
            },
            {
              id: expect.any(String),
              groupId: past,
              startsOn: "2025-09-01",
              endsOn: "2026-08-31",
              endReason: "Uji penggantian",
              ...ownCode,
              cohortYear: 2023,
            },
          ],
          members: [
            {
              id: studentIds[1],
              nim: "9900020001",
              name: "Binaan Uji Ani",
              className: null,
              cohortYear: 2025,
              status: "active",
              opensDetail: false,
              group: ownCode,
            },
            {
              id: studentIds[0],
              nim: "9900020002",
              name: "Binaan Uji Budi",
              className: "3-02",
              cohortYear: 2026,
              status: "active",
              opensDetail: false,
              group: ownCode,
            },
            {
              id: studentIds[2],
              nim: "9900020003",
              name: "Binaan Uji Cuti",
              className: null,
              cohortYear: 2026,
              status: "on_leave",
              opensDetail: false,
              group: ownCode,
            },
            {
              id: elsewhere,
              nim: "9900020006",
              name: "Binaan Uji Tetangga",
              className: null,
              cohortYear: 2026,
              status: "active",
              opensDetail: false,
              group: foreignCode,
            },
          ],
        },
      });
    });
  });

  it("marks only the students whose detail the account may open, and still lists the others", async () => {
    await inTestDatabase(async (db) => {
      const { id, program } = await addBusyMentor(db);
      const ofProgram = inArray(students.studyProgramId, [program]);

      const answer = await readMentor(db, EVERYONE, id, ofProgram);

      if (answer.kind !== "found") throw new Error("The mentor was not found.");
      const { members } = answer.mentor;
      const opening = members.filter((member) => member.opensDetail);
      expect(opening.map((member) => member.nim)).toEqual([
        "9900020001",
        "9900020002",
        "9900020003",
      ]);
      expect(members.map((member) => member.nim)).toContain("9900020006");
    });
  });

  it("does not give the NIP of the mentor", async () => {
    await inTestDatabase(async (db) => {
      const { id } = await addBusyMentor(db);

      const answer = await readMentor(db, EVERYONE, id, null);

      expect(JSON.stringify(answer)).not.toContain("990000000000000002");
    });
  });

  it("gives a head of a study program only what belongs to that program", async () => {
    await inTestDatabase(async (db) => {
      const { id, program, other } = await addBusyMentor(db);

      const own = await found(db, onlyPrograms([program]), id);
      const foreign = await found(db, onlyPrograms([other]), id);

      expect(own.groups.map(groupCode)).toEqual(["KP 25-UJIPGSATU-01"]);
      expect(own.students).toBe(2);
      expect(own.assignments.map(groupCode)).toEqual([
        "KP 25-UJIPGSATU-01",
        "KP 23-UJIPGSATU-01",
      ]);
      expect(own.members.map((member) => member.nim)).toEqual([
        "9900020001",
        "9900020002",
        "9900020003",
      ]);
      expect(foreign.groups.map(groupCode)).toEqual(["KP 24-UJIPGDUA-01"]);
      expect(foreign.assignments.map(groupCode)).toEqual(["KP 24-UJIPGDUA-01"]);
      expect(foreign.members.map((member) => member.nim)).toEqual([
        "9900020006",
      ]);
    });
  });

  it("refuses a head of a study program a mentor who holds no group of that program today", async () => {
    await inTestDatabase(async (db) => {
      const { id } = await addBusyMentor(db);
      const third = await addTestProgram(db, "UJIPGTIGA");
      const before = await addTestMentor(db, { name: "Pengasuh Uji Dulu" });
      await addTestMentorRole(db, before);
      const group = await addTestGroup(db, third);
      await addTestMentorLine(db, group, before, { endsOn: "2026-09-30" });
      const limit = onlyPrograms([third]);

      expect(await readMentor(db, limit, id, null)).toEqual({
        kind: "refused",
      });
      expect(await readMentor(db, limit, before, null)).toEqual({
        kind: "refused",
      });
    });
  });

  it("refuses every mentor to an account with no study program", async () => {
    await inTestDatabase(async (db) => {
      const { id } = await addBusyMentor(db);

      expect(await readMentor(db, onlyPrograms([]), id, null)).toEqual({
        kind: "refused",
      });
    });
  });

  it("gives a Cadangan mentor with no group, no history and no student", async () => {
    await inTestDatabase(async (db) => {
      const id = await addTestMentor(db, { name: "Pengasuh Uji Cadangan" });
      await addTestMentorRole(db, id);

      const mentor = await found(db, EVERYONE, id);

      expect(mentor).toMatchObject({
        status: "reserve",
        inactiveSince: null,
        inactiveReason: null,
        groups: [],
        students: 0,
        assignments: [],
        members: [],
      });
    });
  });

  it("gives a Tidak aktif mentor the day the role was taken, and the groups held before", async () => {
    await inTestDatabase(async (db) => {
      const program = await addTestProgram(db, "UJIPGLEPAS");
      const id = await addTestMentor(db, { name: "Pengasuh Uji Lepas" });
      await addTestRoleTaken(db, id, new Date("2026-03-04T02:00:00Z"));
      const group = await addTestGroup(db, program);
      await addTestMentorLine(db, group, id, { endsOn: "2026-09-30" });
      const member = await addTestStudent(db, program, {
        nim: "9900020101",
        name: "Binaan Uji Bekas",
      });
      await addTestMembers(db, group, [member]);

      const mentor = await found(db, EVERYONE, id);

      expect(mentor).toMatchObject({
        status: "inactive",
        inactiveSince: "2026-03-04",
        inactiveReason: "Akun dihapus atau peran diganti",
        groups: [],
        students: 0,
        members: [],
      });
      expect(mentor.assignments.map(groupCode)).toEqual([
        "KP 26-UJIPGLEPAS-01",
      ]);
    });
  });

  it("answers not found for an account that never was a mentor", async () => {
    await inTestDatabase(async (db) => {
      const id = await addTestMentor(db, { name: "Pegawai Uji Biasa" });

      expect(await readMentor(db, EVERYONE, id, null)).toEqual({
        kind: "not_found",
      });
    });
  });

  it("answers not found for the account of a student, whatever its roles", async () => {
    await inTestDatabase(async (db) => {
      const program = await addTestProgram(db, "UJIPGMHS");
      const studentId = await addTestStudent(db, program, {
        nim: "9900020201",
        name: "Mahasiswa Uji Peran",
      });
      const id = await addTestMentor(db, {
        name: "Mahasiswa Uji Peran",
        studentId,
      });
      await addTestMentorRole(db, id);

      expect(await readMentor(db, EVERYONE, id, null)).toEqual({
        kind: "not_found",
      });
    });
  });

  it("gives nothing of an ended group: no group held, no history line and no student", async () => {
    await inTestDatabase(async (db) => {
      const program = await addTestProgram(db, "UJIPGAKHIR");
      const id = await addTestMentor(db, { name: "Pengasuh Uji Batal" });
      await addTestMentorRole(db, id);
      const ended = await addTestEndedGroup(db, program);
      await addTestMentorLine(db, ended, id);
      const member = await addTestStudent(db, program, {
        nim: "9900020101",
        name: "Binaan Uji Batal",
      });
      await addTestMembers(db, ended, [member]);

      const mentor = await found(db, EVERYONE, id);

      expect(mentor).toMatchObject({
        status: "reserve",
        groups: [],
        students: 0,
        assignments: [],
        members: [],
      });
    });
  });

  it("answers not found for a mentor that does not exist", async () => {
    await inTestDatabase(async (db) => {
      const missing = "00000000-0000-4000-8000-000000000000";

      expect(await readMentor(db, EVERYONE, missing, null)).toEqual({
        kind: "not_found",
      });
    });
  });

  it("answers not found for what is no id, without asking the database", async () => {
    await inTestDatabase(async (db) => {
      expect(await readMentor(db, EVERYONE, "bukan-id", null)).toEqual({
        kind: "not_found",
      });
    });
  });
});
