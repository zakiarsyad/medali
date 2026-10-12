import { describe, expect, it } from "vitest";
import type { RowLimit } from "@/auth/access";
import type { Database } from "@/db/connect";
import { withTestDatabase } from "@/db/test-database";
import { readGroup } from "./group-detail";
import {
  addTestGroup,
  addTestMembers,
  addTestMentor,
  addTestMentorLine,
  addTestProgram,
  addTestStudent,
  TEST_GROUP_STARTS_ON,
} from "./test-records";

const inTestDatabase = withTestDatabase();

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
  return { id, program, studentIds };
}

describe("readGroup", () => {
  it("gives what the page of a group shows", async () => {
    await inTestDatabase(async (db) => {
      const { id, studentIds } = await addFullGroup(db);

      const answer = await readGroup(db, EVERYONE, id);

      expect(answer).toEqual({
        kind: "found",
        group: {
          id,
          cohortYear: 2024,
          entryPath: "regular",
          number: 1,
          programCode: "UJIRINCI",
          studyProgram: "UJIRINCI",
          startsOn: TEST_GROUP_STARTS_ON,
          mentors: [
            {
              id: expect.any(String),
              name: "Pengasuh Uji Baru",
              title: "M.Si.",
              unit: "Unit Uji",
              startsOn: "2026-10-01",
              endsOn: null,
              endReason: null,
            },
            {
              id: expect.any(String),
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
            },
            {
              id: studentIds[0],
              nim: "9900019002",
              name: "Anggota Uji Budi",
              className: "3-02",
              cohortYear: 2026,
              status: "active",
            },
            {
              id: studentIds[2],
              nim: "9900019003",
              name: "Anggota Uji Cuti",
              className: null,
              cohortYear: 2026,
              status: "on_leave",
            },
          ],
        },
      });
    });
  });

  it("does not give the NIP of a mentor", async () => {
    await inTestDatabase(async (db) => {
      const { id } = await addFullGroup(db);

      const answer = await readGroup(db, EVERYONE, id);

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

      const answer = await readGroup(db, EVERYONE, id);

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

      const answer = await readGroup(db, onlyPrograms([program]), id);

      expect(answer.kind).toBe("found");
    });
  });

  it("refuses a head of a study program a group of another program", async () => {
    await inTestDatabase(async (db) => {
      const { id } = await addFullGroup(db);
      const other = await addTestProgram(db, "UJIRINCILAIN");

      const answer = await readGroup(db, onlyPrograms([other]), id);

      expect(answer).toEqual({ kind: "refused" });
    });
  });

  it("refuses every group to an account with no study program", async () => {
    await inTestDatabase(async (db) => {
      const { id } = await addFullGroup(db);

      expect(await readGroup(db, onlyPrograms([]), id)).toEqual({
        kind: "refused",
      });
    });
  });

  it("answers not found for a group that does not exist", async () => {
    await inTestDatabase(async (db) => {
      const missing = "00000000-0000-4000-8000-000000000000";

      expect(await readGroup(db, EVERYONE, missing)).toEqual({
        kind: "not_found",
      });
    });
  });

  it("answers not found for what is no id, without asking the database", async () => {
    await inTestDatabase(async (db) => {
      expect(await readGroup(db, EVERYONE, "bukan-id")).toEqual({
        kind: "not_found",
      });
    });
  });
});
