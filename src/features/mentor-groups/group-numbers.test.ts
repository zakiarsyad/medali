import { describe, expect, it } from "vitest";
import type { RowLimit } from "@/auth/access";
import type { Database } from "@/db/connect";
import type { students } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { readGroupNumbers } from "./group-numbers";
import { GROUP_MIN } from "./group-size";
import {
  addTestGroup,
  addTestMembersWithStatus,
  addTestProgram,
} from "./test-records";

const inTestDatabase = withTestDatabase();

type Status = (typeof students.$inferSelect)["status"];

function onlyProgram(id: number): RowLimit {
  return { kind: "some", studyProgramIds: [id], menteesOf: [], studentIds: [] };
}

function statuses(active: number, others: Status[] = []): Status[] {
  return [...Array<Status>(active).fill("active"), ...others];
}

/** A program with a group of 25, a group of 3 and a group of nobody. */
async function addGroupsOfThreeSizes(db: Database): Promise<number> {
  const studyProgramId = await addTestProgram(db, "UJIANGKA");
  const usual = await addTestGroup(db, studyProgramId, { number: 1 });
  const small = await addTestGroup(db, studyProgramId, { number: 2 });
  await addTestGroup(db, studyProgramId, { number: 3 });
  await addTestMembersWithStatus(
    db,
    { id: usual, studyProgramId },
    9900018501,
    statuses(GROUP_MIN, ["on_leave", "inactive"]),
  );
  await addTestMembersWithStatus(
    db,
    { id: small, studyProgramId },
    9900018601,
    statuses(3),
  );
  return studyProgramId;
}

describe("readGroupNumbers", () => {
  it("counts the groups, their Aktif members and the groups of a usual size", async () => {
    await inTestDatabase(async (db) => {
      const program = await addGroupsOfThreeSizes(db);

      const numbers = await readGroupNumbers(db, onlyProgram(program));

      expect(numbers).toEqual({ groups: 3, members: 28, usualSize: 1 });
    });
  });

  it("counts for a head of a study program their own groups only", async () => {
    await inTestDatabase(async (db) => {
      await addGroupsOfThreeSizes(db);
      const other = await addTestProgram(db, "UJIANGKALAIN");
      const id = await addTestGroup(db, other);
      await addTestMembersWithStatus(
        db,
        { id, studyProgramId: other },
        9900018701,
        statuses(2),
      );

      const numbers = await readGroupNumbers(db, onlyProgram(other));

      expect(numbers).toEqual({ groups: 1, members: 2, usualSize: 0 });
    });
  });

  it("counts every group for an account that sees every row", async () => {
    await inTestDatabase(async (db) => {
      const everyone: RowLimit = { kind: "all" };
      const before = await readGroupNumbers(db, everyone);
      await addGroupsOfThreeSizes(db);

      const after = await readGroupNumbers(db, everyone);

      expect(after).toEqual({
        groups: before.groups + 3,
        members: before.members + 28,
        usualSize: before.usualSize + 1,
      });
    });
  });

  it("counts nothing for an account with no study program", async () => {
    await inTestDatabase(async (db) => {
      await addGroupsOfThreeSizes(db);
      const nothing: RowLimit = {
        kind: "some",
        studyProgramIds: [],
        menteesOf: [],
        studentIds: [],
      };

      const numbers = await readGroupNumbers(db, nothing);

      expect(numbers).toEqual({ groups: 0, members: 0, usualSize: 0 });
    });
  });
});
