// Sample Tahun akademik of this file: 4010 to 4010.
// Sample NIMs of this file: 9987650000 to 9987650099.
import { describe, expect, it } from "vitest";
import type { AccountForAccess, RowLimit } from "@/auth/access";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { withTestDatabase } from "@/db/test-database";
import { readGroupReratas, readMentorReratas } from "./medali-averages";
import {
  addTestGroup,
  addTestMentor,
  addTestMentorLine,
  addTestProgram,
} from "./test-records";
import {
  addTestAssessor,
  addTestScoredMember,
  addTestScores,
  allScores,
  type TestGroupOf,
} from "./test-scores";
import { groupRowsFor } from "./visible-groups";
import { mentorRowsFor } from "./visible-mentors";

const inTestDatabase = withTestDatabase();

const YEAR = 4010;

/** A group to add scored members to, with a period of this file's year. */
async function addTestGroupOf(
  db: Database,
  programId: number,
  id: string,
): Promise<TestGroupOf> {
  return { id, programId, by: await addTestAssessor(db, YEAR) };
}

const EVERY_ROW: RowLimit = { kind: "all" };

function onlyPrograms(studyProgramIds: number[]): RowLimit {
  return { kind: "some", studyProgramIds, menteesOf: [], studentIds: [] };
}

function account(roles: RoleId[]): AccountForAccess {
  return {
    id: "0b4f6c1e-6f0e-4f55-9d0a-0d3c1e2f8101",
    roles,
    studyProgramId: null,
    studentId: null,
  };
}

/**
 * A group of one program held by a mentor, with members scored 80 and
 * 70, one not assessed and one on Cuti scored 40.
 */
async function addRecords(db: Database) {
  const programId = await addTestProgram(db, "UJIRERATA");
  const otherProgramId = await addTestProgram(db, "UJIRERATA-LAIN");
  const groupId = await addTestGroup(db, programId);
  const mentorId = await addTestMentor(db, { name: "Pengasuh Uji Rerata" });
  await addTestMentorLine(db, groupId, mentorId);
  const group = await addTestGroupOf(db, programId, groupId);
  const { by } = group;
  await addTestScoredMember(db, group, "9987650001", allScores(80));
  const seventy = await addTestScoredMember(
    db,
    group,
    "9987650002",
    allScores(70),
  );
  await addTestScoredMember(db, group, "9987650003", null);
  await addTestScoredMember(db, group, "9987650004", allScores(40), {
    status: "on_leave",
  });
  return { programId, otherProgramId, groupId, mentorId, by, seventy };
}

describe("readGroupReratas", () => {
  it("gives 75.0 for members of 80 and 70, leaving out the one not assessed and the one on Cuti", async () => {
    await inTestDatabase(async (db) => {
      const { groupId } = await addRecords(db);

      const reratas = await readGroupReratas(db, EVERY_ROW, [groupId]);

      expect(reratas.get(groupId)).toBe(75);
    });
  });

  it("takes the latest assessment of each member", async () => {
    await inTestDatabase(async (db) => {
      const { groupId, by, seventy } = await addRecords(db);
      const later = new Date("2026-10-15T03:00:00Z");
      await addTestScores(db, by, seventy, allScores(90), later);

      const reratas = await readGroupReratas(db, EVERY_ROW, [groupId]);

      expect(reratas.get(groupId)).toBe(85);
    });
  });

  it("gives no average for a group where nobody is assessed", async () => {
    await inTestDatabase(async (db) => {
      const programId = await addTestProgram(db, "UJIRERATA-KOSONG");
      const groupId = await addTestGroup(db, programId);
      const group = await addTestGroupOf(db, programId, groupId);
      await addTestScoredMember(db, group, "9987650011", null);

      const reratas = await readGroupReratas(db, EVERY_ROW, [groupId]);

      expect(reratas.has(groupId)).toBe(false);
    });
  });

  it("gives Ketua Program Studi the average of a group of their program", async () => {
    await inTestDatabase(async (db) => {
      const { groupId, programId } = await addRecords(db);

      const limit = onlyPrograms([programId]);
      const reratas = await readGroupReratas(db, limit, [groupId]);

      expect(reratas.get(groupId)).toBe(75);
    });
  });

  it("refuses Ketua Program Studi the average of a group outside their program, asked by hand", async () => {
    await inTestDatabase(async (db) => {
      const { groupId, otherProgramId } = await addRecords(db);

      const limit = onlyPrograms([otherProgramId]);
      const reratas = await readGroupReratas(db, limit, [groupId]);

      expect(reratas.size).toBe(0);
    });
  });
});

describe("readMentorReratas", () => {
  it("gives the average over all the mentees of the groups held today", async () => {
    await inTestDatabase(async (db) => {
      const { mentorId, programId, by } = await addRecords(db);
      const secondId = await addTestGroup(db, programId, { number: 2 });
      await addTestMentorLine(db, secondId, mentorId);
      const second: TestGroupOf = { id: secondId, programId, by };
      await addTestScoredMember(db, second, "9987650021", allScores(90));

      const reratas = await readMentorReratas(db, EVERY_ROW, [mentorId]);

      expect(reratas.get(mentorId)).toBe(80);
    });
  });

  it("leaves out a group the mentor no longer holds", async () => {
    await inTestDatabase(async (db) => {
      const { mentorId, programId, by } = await addRecords(db);
      const oldId = await addTestGroup(db, programId, { number: 3 });
      await addTestMentorLine(db, oldId, mentorId, {
        endsOn: "2026-09-30",
        endReason: "Mutasi",
      });
      const old: TestGroupOf = { id: oldId, programId, by };
      await addTestScoredMember(db, old, "9987650031", allScores(40));

      const reratas = await readMentorReratas(db, EVERY_ROW, [mentorId]);

      expect(reratas.get(mentorId)).toBe(75);
    });
  });

  it("refuses Ketua Program Studi the average of a mentor outside their program, asked by hand", async () => {
    await inTestDatabase(async (db) => {
      const { mentorId, otherProgramId } = await addRecords(db);

      const limit = onlyPrograms([otherProgramId]);
      const reratas = await readMentorReratas(db, limit, [mentorId]);

      expect(reratas.size).toBe(0);
    });
  });
});

describe("who may read the averages", () => {
  it.each(["mentor", "student"] as const)(
    "refuses %s every average of a group or a mentor, asked by hand",
    (role) => {
      expect(groupRowsFor(account([role]))).toBeNull();
      expect(mentorRowsFor(account([role]))).toBeNull();
    },
  );
});
