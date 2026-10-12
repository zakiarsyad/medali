import { describe, expect, it } from "vitest";
import type { RowLimit } from "@/auth/access";
import type { Database } from "@/db/connect";
import { withTestDatabase } from "@/db/test-database";
import { groupCode } from "@/ui/group-code";
import { PAGE_SIZE } from "@/ui/list-pages";
import { listGroups } from "./group-list";
import { type GroupListFilters, NO_FILTERS } from "./group-list-address";
import {
  addTestEndedGroup,
  addTestGroup,
  addTestMembers,
  addTestMembersWithStatus,
  addTestMentor,
  addTestMentorLine,
  addTestProgram,
  addTestStudent,
} from "./test-records";

const inTestDatabase = withTestDatabase();

function onlyProgram(id: number): RowLimit {
  return { kind: "some", studyProgramIds: [id], menteesOf: [], studentIds: [] };
}

async function codesFound(
  db: Database,
  limit: RowLimit,
  filters: Partial<GroupListFilters>,
): Promise<string[]> {
  const listed = await listGroups(db, limit, { ...NO_FILTERS, ...filters }, 1);
  return listed.groups.map(groupCode);
}

/** A program with a 2024 group, a 2025 group and a 2025 alih program group. */
async function addFilterGroups(db: Database): Promise<number> {
  const program = await addTestProgram(db, "UJISARING");
  const ani = await addTestMentor(db, { name: "Pengasuh Uji Ani" });
  const budi = await addTestMentor(db, { name: "Pengasuh Uji Budi" });
  const first = await addTestGroup(db, program, { cohortYear: 2024 });
  const second = await addTestGroup(db, program, {
    cohortYear: 2025,
    number: 12,
  });
  const third = await addTestGroup(db, program, {
    cohortYear: 2025,
    entryPath: "transfer",
  });
  await addTestMentorLine(db, first, ani);
  await addTestMentorLine(db, second, budi);
  await addTestMentorLine(db, third, budi);
  return program;
}

describe("listGroups", () => {
  it("leaves out an ended group, for every account", async () => {
    await inTestDatabase(async (db) => {
      const everyone: RowLimit = { kind: "all" };
      const before = await listGroups(db, everyone, NO_FILTERS, 1);
      const program = await addTestProgram(db, "UJIAKHIR");
      await addTestEndedGroup(db, program);
      await addTestGroup(db, program, { number: 2 });

      const whole = await listGroups(db, everyone, NO_FILTERS, 1);

      expect(whole.matching).toBe(before.matching + 1);
      expect(await codesFound(db, onlyProgram(program), {})).toEqual([
        "KP 26-UJIAKHIR-02",
      ]);
    });
  });

  it("gives what a row shows", async () => {
    await inTestDatabase(async (db) => {
      const program = await addTestProgram(db, "UJIBARIS");
      const earlier = await addTestMentor(db, { name: "Pengasuh Uji Lama" });
      const mentor = await addTestMentor(db, { name: "Pengasuh Uji Baru" });
      const id = await addTestGroup(db, program, { cohortYear: 2024 });
      await addTestMentorLine(db, id, earlier, {
        endsOn: "2026-09-30",
        endReason: "Uji penggantian",
      });
      await addTestMentorLine(db, id, mentor, { startsOn: "2026-10-01" });

      const listed = await listGroups(db, onlyProgram(program), NO_FILTERS, 1);

      expect(listed).toEqual({
        matching: 1,
        page: 1,
        groups: [
          {
            id,
            cohortYear: 2024,
            entryPath: "regular",
            number: 1,
            programCode: "UJIBARIS",
            studyProgram: "UJIBARIS",
            mentorName: "Pengasuh Uji Baru",
            mentorSince: "2026-10-01",
            members: 0,
            mentorLines: 2,
          },
        ],
      });
    });
  });

  it("counts the Aktif members only, not those on Cuti, Non aktif or removed", async () => {
    await inTestDatabase(async (db) => {
      const program = await addTestProgram(db, "UJIHITUNG");
      const id = await addTestGroup(db, program);
      const group = { id, studyProgramId: program };
      await addTestMembersWithStatus(db, group, 9900017001, [
        "active",
        "active",
        "on_leave",
        "inactive",
      ]);
      const removed = await addTestStudent(db, program, {
        nim: "9900017009",
        name: "Anggota Uji Dihapus",
        deletedAt: new Date(),
      });
      await addTestMembers(db, id, [removed]);
      const other = await addTestGroup(db, program, { number: 2 });
      await addTestMembersWithStatus(
        db,
        { id: other, studyProgramId: program },
        9900017101,
        ["active"],
      );

      const listed = await listGroups(db, onlyProgram(program), NO_FILTERS, 1);

      expect(listed.groups.map((row) => row.members)).toEqual([2, 1]);
    });
  });

  it("shows a group without a mentor of today, with no mentor", async () => {
    await inTestDatabase(async (db) => {
      const program = await addTestProgram(db, "UJIKOSONG");
      await addTestGroup(db, program);

      const listed = await listGroups(db, onlyProgram(program), NO_FILTERS, 1);

      expect(listed.groups).toMatchObject([
        { mentorName: null, mentorSince: null, mentorLines: 0 },
      ]);
    });
  });

  it("lists the newest angkatan first, then by jalur and number", async () => {
    await inTestDatabase(async (db) => {
      const limit = onlyProgram(await addFilterGroups(db));

      expect(await codesFound(db, limit, {})).toEqual([
        "KP 25-UJISARING-12",
        "KP 25-UJISARING-AJ-01",
        "KP 24-UJISARING-01",
      ]);
    });
  });

  it("finds each group by the code its row shows", async () => {
    await inTestDatabase(async (db) => {
      const limit = onlyProgram(await addFilterGroups(db));
      const codes = await codesFound(db, limit, {});

      for (const code of codes) {
        expect(await codesFound(db, limit, { query: code })).toEqual([code]);
      }
    });
  });

  it("finds groups by a part of the code, in any letter case", async () => {
    await inTestDatabase(async (db) => {
      const limit = onlyProgram(await addFilterGroups(db));

      expect(await codesFound(db, limit, { query: "kp 25-uji" })).toEqual([
        "KP 25-UJISARING-12",
        "KP 25-UJISARING-AJ-01",
      ]);
    });
  });

  it("finds groups by the name of the mentor of today", async () => {
    await inTestDatabase(async (db) => {
      const limit = onlyProgram(await addFilterGroups(db));

      expect(await codesFound(db, limit, { query: "uji ani" })).toEqual([
        "KP 24-UJISARING-01",
      ]);
    });
  });

  it("does not find a group by a mentor who held it before", async () => {
    await inTestDatabase(async (db) => {
      const program = await addTestProgram(db, "UJILAMA");
      const earlier = await addTestMentor(db, { name: "Pengasuh Uji Lama" });
      const mentor = await addTestMentor(db, { name: "Pengasuh Uji Baru" });
      const id = await addTestGroup(db, program);
      await addTestMentorLine(db, id, earlier, { endsOn: "2026-09-30" });
      await addTestMentorLine(db, id, mentor, { startsOn: "2026-10-01" });
      const limit = onlyProgram(program);

      expect(await codesFound(db, limit, { query: "Uji Lama" })).toEqual([]);
      expect(await codesFound(db, limit, { query: "Uji Baru" })).toEqual([
        "KP 26-UJILAMA-01",
      ]);
    });
  });

  it("narrows to an angkatan and to a program studi", async () => {
    await inTestDatabase(async (db) => {
      const program = await addFilterGroups(db);
      const other = await addTestProgram(db, "UJILAIN");
      await addTestGroup(db, other, { cohortYear: 2024 });
      const everyone: RowLimit = { kind: "all" };

      expect(
        await codesFound(db, everyone, {
          studyProgramId: program,
          cohortYear: 2024,
        }),
      ).toEqual(["KP 24-UJISARING-01"]);
      expect(await codesFound(db, everyone, { studyProgramId: other })).toEqual(
        ["KP 24-UJILAIN-01"],
      );
    });
  });

  it("gives nothing when no group matches", async () => {
    await inTestDatabase(async (db) => {
      const limit = onlyProgram(await addFilterGroups(db));

      const listed = await listGroups(
        db,
        limit,
        { ...NO_FILTERS, query: "tidak ada yang begini" },
        1,
      );

      expect(listed).toEqual({ groups: [], matching: 0, page: 1 });
    });
  });

  it("shows a head of a study program the groups of that program only", async () => {
    await inTestDatabase(async (db) => {
      const program = await addFilterGroups(db);
      const other = await addTestProgram(db, "UJILAIN");
      await addTestGroup(db, other);

      const codes = await codesFound(db, onlyProgram(other), {});
      const asked = await codesFound(db, onlyProgram(other), {
        studyProgramId: program,
      });

      expect(codes).toEqual(["KP 26-UJILAIN-01"]);
      expect(asked).toEqual([]);
    });
  });

  it("shows no group to an account with no study program", async () => {
    await inTestDatabase(async (db) => {
      await addFilterGroups(db);
      const nothing: RowLimit = {
        kind: "some",
        studyProgramIds: [],
        menteesOf: [],
        studentIds: [],
      };

      expect(await codesFound(db, nothing, {})).toEqual([]);
    });
  });

  it("gives one page of 25 rows, and the last page when asked past it", async () => {
    await inTestDatabase(async (db) => {
      const program = await addTestProgram(db, "UJIHALAMAN");
      for (let number = 1; number <= PAGE_SIZE + 2; number += 1) {
        await addTestGroup(db, program, { number });
      }
      const limit = onlyProgram(program);

      const first = await listGroups(db, limit, NO_FILTERS, 1);
      const past = await listGroups(db, limit, NO_FILTERS, 9);

      expect(first.groups.length).toBe(PAGE_SIZE);
      expect(first.matching).toBe(PAGE_SIZE + 2);
      expect(past.page).toBe(2);
      expect(past.groups.map(groupCode)).toEqual([
        "KP 26-UJIHALAMAN-26",
        "KP 26-UJIHALAMAN-27",
      ]);
    });
  });
});
