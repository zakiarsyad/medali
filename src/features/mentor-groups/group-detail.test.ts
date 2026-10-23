// Sample Tahun akademik of this file: 4012 to 4012.
import { eq, inArray } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { RowLimit } from "@/auth/access";
import type { Database } from "@/db/connect";
import { students } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { type GroupDetail, readGroup } from "./group-detail";
import {
  addTestEndedGroup,
  addTestGroup,
  addTestMembers,
  addTestMembersWithStatus,
  addTestMentor,
  addTestMentorLine,
  addTestProgram,
  addTestStudent,
  TEST_GROUP_STARTS_ON,
} from "./test-records";
import { addTestAssessor, addTestScores, allScores } from "./test-scores";

const inTestDatabase = withTestDatabase();

/** After the default day of an assessment, so it is the latest one. */
const LATER = new Date("2026-10-02T03:00:00Z");

const EVERYONE: RowLimit = { kind: "all" };

function onlyPrograms(studyProgramIds: number[]): RowLimit {
  return { kind: "some", studyProgramIds, menteesOf: [], studentIds: [] };
}

/** A 2024 group whose first mentor was replaced, with members of each status. */
async function addFullGroup(db: Database) {
  const program = await addTestProgram(db, "UJIRINCI");
  const id = await addTestGroup(db, program, { cohortYear: 2024 });
  const earlier = await addTestMentor(db, { name: "Pengasuh Uji Lama" });
  const mentor = await addTestMentor(db, {
    name: "Pengasuh Uji Baru",
    title: "M.Si.",
    unit: "Unit Uji",
    nip: "990000000000000001",
  });
  await addTestMentorLine(db, id, earlier, {
    endsOn: "2026-09-30",
    endReason: "Uji penggantian",
  });
  await addTestMentorLine(db, id, mentor, { startsOn: "2026-10-01" });
  const rows = [
    { nim: "9900019002", name: "Anggota Uji Budi", className: "3-02" },
    { nim: "9900019001", name: "Anggota Uji Ani", cohortYear: 2024 },
    { nim: "9900019003", name: "Anggota Uji Cuti", status: "on_leave" },
    { nim: "9900019004", name: "Anggota Uji Nonaktif", status: "inactive" },
    { nim: "9900019005", name: "Anggota Uji Dihapus", deletedAt: new Date() },
  ] as const;
  const studentIds: string[] = [];
  for (const row of rows) {
    studentIds.push(await addTestStudent(db, program, row));
  }
  await addTestMembers(db, id, studentIds);
  return { id, program, earlier, mentor, studentIds };
}

describe("readGroup", () => {
  it("gives what the page of a group shows", async () => {
    await inTestDatabase(async (db) => {
      const { id, program, earlier, mentor, studentIds } =
        await addFullGroup(db);

      const answer = await readGroup(db, EVERYONE, id, null);

      expect(answer).toEqual({
        kind: "found",
        group: {
          id,
          studyProgramId: program,
          cohortYear: 2024,
          entryPath: "regular",
          number: 1,
          programCode: "UJIRINCI",
          studyProgram: "UJIRINCI",
          startsOn: TEST_GROUP_STARTS_ON,
          mentors: [
            {
              id: expect.any(String),
              mentorId: mentor,
              name: "Pengasuh Uji Baru",
              title: "M.Si.",
              unit: "Unit Uji",
              startsOn: "2026-10-01",
              endsOn: null,
              endReason: null,
            },
            {
              id: expect.any(String),
              mentorId: earlier,
              name: "Pengasuh Uji Lama",
              title: null,
              unit: null,
              startsOn: TEST_GROUP_STARTS_ON,
              endsOn: "2026-09-30",
              endReason: "Uji penggantian",
            },
          ],
          members: [
            {
              id: studentIds[1],
              nim: "9900019001",
              name: "Anggota Uji Ani",
              className: null,
              cohortYear: 2024,
              status: "active",
              opensDetail: false,
            },
            {
              id: studentIds[0],
              nim: "9900019002",
              name: "Anggota Uji Budi",
              className: "3-02",
              cohortYear: 2026,
              status: "active",
              opensDetail: false,
            },
            {
              id: studentIds[2],
              nim: "9900019003",
              name: "Anggota Uji Cuti",
              className: null,
              cohortYear: 2026,
              status: "on_leave",
              opensDetail: false,
            },
          ],
          memberPage: 1,
          memberCounts: { listed: 3, counted: 2, classes: 1 },
          summary: null,
        },
      });
    });
  });

  it("marks only the members whose detail the account may open", async () => {
    await inTestDatabase(async (db) => {
      const { id, studentIds } = await addFullGroup(db);
      const [budi, ani] = studentIds;
      if (!budi || !ani) throw new Error("The members were not added.");

      const answer = await readGroup(db, EVERYONE, id, eq(students.id, ani));

      if (answer.kind !== "found") throw new Error("The group was not found.");
      const opening = answer.group.members.filter(
        (member) => member.opensDetail,
      );
      expect(opening.map((member) => member.id)).toEqual([ani]);
      expect(answer.group.members.map((member) => member.id)).toContain(budi);
    });
  });

  it("does not give the NIP of a mentor", async () => {
    await inTestDatabase(async (db) => {
      const { id } = await addFullGroup(db);

      const answer = await readGroup(db, EVERYONE, id, null);

      expect(JSON.stringify(answer)).not.toContain("990000000000000001");
    });
  });

  it("lists only the members of the group asked for", async () => {
    await inTestDatabase(async (db) => {
      const { id, program } = await addFullGroup(db);
      const other = await addTestGroup(db, program, { number: 2 });
      const outsider = await addTestStudent(db, program, {
        nim: "9900019009",
        name: "Anggota Uji Lain",
      });
      await addTestMembers(db, other, [outsider]);

      const answer = await readGroup(db, EVERYONE, id, null);

      if (answer.kind !== "found") throw new Error("The group was not found.");
      expect(answer.group.members.map((member) => member.nim)).toEqual([
        "9900019001",
        "9900019002",
        "9900019003",
      ]);
    });
  });

  it("gives a head of a study program a group of that program", async () => {
    await inTestDatabase(async (db) => {
      const { id, program } = await addFullGroup(db);

      const answer = await readGroup(db, onlyPrograms([program]), id, null);

      expect(answer.kind).toBe("found");
    });
  });

  it("refuses a head of a study program a group of another program", async () => {
    await inTestDatabase(async (db) => {
      const { id } = await addFullGroup(db);
      const other = await addTestProgram(db, "UJIRINCILAIN");

      const answer = await readGroup(db, onlyPrograms([other]), id, null);

      expect(answer).toEqual({ kind: "refused" });
    });
  });

  it("refuses every group to an account with no study program", async () => {
    await inTestDatabase(async (db) => {
      const { id } = await addFullGroup(db);

      expect(await readGroup(db, onlyPrograms([]), id, null)).toEqual({
        kind: "refused",
      });
    });
  });

  it("answers not found for an ended group", async () => {
    await inTestDatabase(async (db) => {
      const program = await addTestProgram(db, "UJIRINCIAKHIR");
      const ended = await addTestEndedGroup(db, program);

      expect(await readGroup(db, EVERYONE, ended, null)).toEqual({
        kind: "not_found",
      });
    });
  });

  it("answers not found for a group that does not exist", async () => {
    await inTestDatabase(async (db) => {
      const missing = "00000000-0000-4000-8000-000000000000";

      expect(await readGroup(db, EVERYONE, missing, null)).toEqual({
        kind: "not_found",
      });
    });
  });

  it("answers not found for what is no id, without asking the database", async () => {
    await inTestDatabase(async (db) => {
      expect(await readGroup(db, EVERYONE, "bukan-id", null)).toEqual({
        kind: "not_found",
      });
    });
  });
});

/** A group of 30 Aktif members, whose names go in the order of their NIM. */
async function addLargeGroup(db: Database) {
  const program = await addTestProgram(db, "UJIHALAMAN");
  const id = await addTestGroup(db, program);
  const statuses = Array.from({ length: 30 }, () => "active" as const);
  const studentIds = await addTestMembersWithStatus(
    db,
    { id, studyProgramId: program },
    9900019300,
    statuses,
  );
  return { id, program, studentIds };
}

async function foundGroup(
  db: Database,
  limit: RowLimit,
  id: string,
  page: number,
): Promise<GroupDetail> {
  const answer = await readGroup(db, limit, id, null, page);
  if (answer.kind !== "found") throw new Error("The group was not found.");
  return answer.group;
}

function idsOf(group: GroupDetail): string[] {
  return group.members.map((member) => member.id);
}

describe("readGroup, a page of members at a time", () => {
  it("reads 25 members on the first page and the rest on the second, with the count of all", async () => {
    await inTestDatabase(async (db) => {
      const { id, studentIds } = await addLargeGroup(db);

      const first = await foundGroup(db, EVERYONE, id, 1);
      const second = await foundGroup(db, EVERYONE, id, 2);

      expect(idsOf(first)).toEqual(studentIds.slice(0, 25));
      expect(idsOf(second)).toEqual(studentIds.slice(25));
      expect(first.memberCounts.listed).toBe(30);
      expect(second.memberPage).toBe(2);
    });
  });

  it("gives the last page for a page past the end", async () => {
    await inTestDatabase(async (db) => {
      const { id, studentIds } = await addLargeGroup(db);

      const group = await foundGroup(db, EVERYONE, id, 9);

      expect(group.memberPage).toBe(2);
      expect(idsOf(group)).toEqual(studentIds.slice(25));
    });
  });

  it("gives a head of a study program the page of a group of that program", async () => {
    await inTestDatabase(async (db) => {
      const { id, program } = await addLargeGroup(db);

      const group = await foundGroup(db, onlyPrograms([program]), id, 1);

      expect(group.members).toHaveLength(25);
      expect(group.memberCounts.listed).toBe(30);
    });
  });

  it("puts the lowest Rerata first and the members not assessed last, across the pages", async () => {
    await inTestDatabase(async (db) => {
      const { id, studentIds } = await addLargeGroup(db);
      const by = await addTestAssessor(db, 4012);
      const [firstByName, secondByName] = studentIds;
      const lastByName = studentIds.at(-1);
      if (!firstByName || !secondByName || !lastByName) {
        throw new Error("The members were not added.");
      }
      for (const studentId of studentIds.slice(1)) {
        await addTestScores(db, by, studentId, allScores(80));
      }
      await addTestScores(db, by, lastByName, allScores(60), LATER);

      const first = await foundGroup(db, EVERYONE, id, 1);
      const second = await foundGroup(db, EVERYONE, id, 2);

      expect(idsOf(first)[0]).toBe(lastByName);
      expect(idsOf(first)[1]).toBe(secondByName);
      expect(idsOf(second).at(-1)).toBe(firstByName);
      const all = new Set([...idsOf(first), ...idsOf(second)]);
      expect(all.size).toBe(30);
    });
  });

  it("counts the Aktif members and their kelas akademik over every page", async () => {
    await inTestDatabase(async (db) => {
      const { id, studentIds } = await addLargeGroup(db);
      const onLeave = studentIds.slice(0, 2);
      const [, , oneClass, otherClass, emptyClass] = studentIds.slice(-5);
      await db
        .update(students)
        .set({ status: "on_leave", className: "9-99" })
        .where(inArray(students.id, onLeave));
      for (const [studentId, className] of [
        [oneClass, "2-01"],
        [otherClass, "2-02"],
        [emptyClass, ""],
      ] as const) {
        if (!studentId) throw new Error("The members were not added.");
        await db
          .update(students)
          .set({ className })
          .where(eq(students.id, studentId));
      }

      const group = await foundGroup(db, EVERYONE, id, 1);

      expect(group.memberCounts).toEqual({
        listed: 30,
        counted: 28,
        classes: 2,
      });
    });
  });

  it("draws the medal from every Aktif member, not from the page", async () => {
    await inTestDatabase(async (db) => {
      const { id, studentIds } = await addLargeGroup(db);
      const by = await addTestAssessor(db, 4012);
      for (const [place, studentId] of studentIds.entries()) {
        const score = place < 26 ? 70 : 90;
        await addTestScores(db, by, studentId, allScores(score));
      }

      const group = await foundGroup(db, EVERYONE, id, 1);

      expect(group.summary?.rerata).toBe(72.7);
      expect(group.summary?.predicates).toEqual({
        gold: 4,
        silver: 0,
        bronze: 26,
        guidance: 0,
      });
    });
  });
});
