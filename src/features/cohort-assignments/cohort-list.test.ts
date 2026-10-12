import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { RowLimit } from "@/auth/access";
import type { Database } from "@/db/connect";
import { cohortAssignments } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { listCohorts } from "./cohort-list";
import { formAssignment } from "./form-assignment";
import {
  addTestActor,
  addTestGroupMembers,
  addTestLiveGroup,
  addTestProgram,
  addTestStudents,
  onlyProgram,
} from "./test-records";
import { EVERY_ROW } from "./visible-assignments";

const inTestDatabase = withTestDatabase();

const NEW_YEAR = 2045;
const OLD_YEAR = 2044;

interface Intake {
  own: number;
  other: number;
}

/**
 * The new angkatan has 30 students of one program and 28 of another who
 * wait; the old one has 26 of the first program, in a group already.
 */
async function addTwoCohorts(db: Database): Promise<Intake> {
  const own = await addTestProgram(db, "UJIDAFTAR");
  const other = await addTestProgram(db, "UJIDAFTAR2");
  await addTestStudents(db, own, 30, 9945000001, { cohortYear: NEW_YEAR });
  await addTestStudents(db, other, 28, 9945000101, { cohortYear: NEW_YEAR });
  const placed = await addTestStudents(db, own, 26, 9945000201, {
    cohortYear: OLD_YEAR,
  });
  const group = await addTestLiveGroup(db, own, { cohortYear: OLD_YEAR });
  await addTestGroupMembers(db, group, placed);
  return { own, other };
}

async function formNewCohort(db: Database): Promise<void> {
  const actor = await addTestActor(db, ["upk_staff"]);
  const formed = await formAssignment(db, actor, {
    cohortYear: NEW_YEAR,
    targetSize: 30,
    method: "balanced",
    version: 0,
  });
  if (!formed.ok) throw new Error(formed.error);
}

function fixNewCohort(db: Database) {
  return db
    .update(cohortAssignments)
    .set({
      status: "fixed",
      decreeNumber: "KEP-UJI/2045",
      effectiveOn: "2045-09-01",
    })
    .where(eq(cohortAssignments.cohortYear, NEW_YEAR));
}

describe("listCohorts", () => {
  it("lists an angkatan whose students wait as not formed, and none whose students have groups", async () => {
    await inTestDatabase(async (db) => {
      await addTwoCohorts(db);

      const cohorts = await listCohorts(db, EVERY_ROW);

      expect(cohorts).toEqual([
        { cohortYear: NEW_YEAR, students: 58, status: null, isNewest: true },
      ]);
    });
  });

  it("shows the status of an angkatan with a penetapan", async () => {
    await inTestDatabase(async (db) => {
      await addTwoCohorts(db);
      await formNewCohort(db);

      const cohorts = await listCohorts(db, EVERY_ROW);

      expect(cohorts).toEqual([
        { cohortYear: NEW_YEAR, students: 58, status: "draft", isNewest: true },
      ]);
    });
  });

  it("counts for a fixed angkatan the Aktif members of its groups", async () => {
    await inTestDatabase(async (db) => {
      await addTwoCohorts(db);
      await formNewCohort(db);
      await fixNewCohort(db);
      const late = await addTestProgram(db, "UJIDAFTAR4");
      await addTestStudents(db, late, 2, 9945000301, { cohortYear: NEW_YEAR });

      const cohorts = await listCohorts(db, EVERY_ROW);

      expect(cohorts).toEqual([
        { cohortYear: NEW_YEAR, students: 58, status: "fixed", isNewest: true },
      ]);
    });
  });

  it("counts for a head of a study program their own program only", async () => {
    await inTestDatabase(async (db) => {
      const { own, other } = await addTwoCohorts(db);

      const before = await listCohorts(db, onlyProgram(own));
      await formNewCohort(db);
      const drafted = await listCohorts(db, onlyProgram(other));
      await fixNewCohort(db);
      const fixed = await listCohorts(db, onlyProgram(other));

      expect(before).toMatchObject([{ students: 30, status: null }]);
      expect(drafted).toMatchObject([{ students: 28, status: "draft" }]);
      expect(fixed).toMatchObject([{ students: 28, status: "fixed" }]);
    });
  });

  it("lists nothing of an angkatan to a head whose program has nothing in it", async () => {
    await inTestDatabase(async (db) => {
      await addTwoCohorts(db);
      await formNewCohort(db);
      const outside = await addTestProgram(db, "UJIDAFTAR3");
      const withoutProgram: RowLimit = {
        kind: "some",
        studyProgramIds: [],
        menteesOf: [],
        studentIds: [],
      };

      expect(await listCohorts(db, onlyProgram(outside))).toEqual([]);
      expect(await listCohorts(db, withoutProgram)).toEqual([]);
    });
  });
});
