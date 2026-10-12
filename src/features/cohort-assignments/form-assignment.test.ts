import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { cohortAssignments } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { formAssignment } from "./form-assignment";
import type { Forming } from "./forming-input";
import { readAssignment } from "./stored-assignment";
import {
  addTestActor,
  addTestGroupMembers,
  addTestLiveGroup,
  addTestProgram,
  addTestStudents,
} from "./test-records";
import { EVERY_ROW } from "./visible-assignments";

const inTestDatabase = withTestDatabase();

const YEAR = 2046;
const OF_YEAR = { cohortYear: YEAR };

const FIRST: Forming = {
  cohortYear: YEAR,
  targetSize: 30,
  method: "balanced",
  version: 0,
};

/** A program with 60 students of the angkatan who wait for a group. */
async function addIntake(db: Database, program = "UJIBENTUK"): Promise<number> {
  const id = await addTestProgram(db, program);
  await addTestStudents(db, id, 60, 9946000001, OF_YEAR);
  return id;
}

async function draftOf(db: Database) {
  const draft = await readAssignment(db, EVERY_ROW, YEAR);
  if (!draft) throw new Error("The angkatan has no penetapan.");
  return draft;
}

describe("formAssignment", () => {
  it("forms the groups of the waiting students and saves them as a draft", async () => {
    await inTestDatabase(async (db) => {
      const program = await addIntake(db);
      const actor = await addTestActor(db, ["upk_staff"], "Pegawai Uji Bentuk");

      const formed = await formAssignment(db, actor, FIRST);

      expect(formed).toEqual({ ok: true, value: 2 });
      const draft = await draftOf(db);
      expect(draft).toMatchObject({
        status: "draft",
        targetSize: 30,
        method: "balanced",
        version: 1,
        savedBy: "Pegawai Uji Bentuk",
      });
      expect(draft.groups.map((group) => group.number)).toEqual([1, 2]);
      expect(draft.groups.map((group) => group.members.length)).toEqual([
        30, 30,
      ]);
      expect(draft.groups[0]).toMatchObject({
        studyProgramId: program,
        programCode: "UJIBENTUK",
        cohortYear: YEAR,
        entryPath: "regular",
        mentor: null,
      });
    });
  });

  it("adds who formed the groups to the log", async () => {
    await inTestDatabase(async (db) => {
      await addIntake(db);
      const actor = await addTestActor(db, ["head_of_unit"], "Kepala Uji");

      await formAssignment(db, actor, FIRST);

      const { log } = await draftOf(db);
      expect(log).toHaveLength(1);
      expect(log[0]).toMatchObject({
        action: "groups_formed",
        by: "Kepala Uji",
      });
    });
  });

  it("places only the students who wait, read at the server", async () => {
    await inTestDatabase(async (db) => {
      const program = await addIntake(db);
      const placed = await addTestStudents(db, program, 5, 9946000101, OF_YEAR);
      const live = await addTestLiveGroup(db, program, { cohortYear: YEAR });
      await addTestGroupMembers(db, live, placed);
      await addTestStudents(db, program, 4, 9946000201, {
        ...OF_YEAR,
        status: "on_leave",
      });
      const actor = await addTestActor(db, ["upk_staff"]);

      await formAssignment(db, actor, FIRST);

      const draft = await draftOf(db);
      const members = draft.groups.flatMap((group) => group.members);
      expect(members).toHaveLength(60);
      for (const id of placed) {
        expect(members.map((member) => member.id)).not.toContain(id);
      }
    });
  });

  it("numbers the groups after the groups of the angkatan already in force", async () => {
    await inTestDatabase(async (db) => {
      const program = await addIntake(db);
      await addTestLiveGroup(db, program, { cohortYear: YEAR, number: 3 });
      const actor = await addTestActor(db, ["upk_staff"]);

      await formAssignment(db, actor, FIRST);

      const draft = await draftOf(db);
      expect(draft.groups.map((group) => group.number)).toEqual([4, 5]);
    });
  });

  it("forms again in place of the draft, as a draft, with one more log line", async () => {
    await inTestDatabase(async (db) => {
      await addIntake(db);
      const actor = await addTestActor(db, ["upk_staff"]);
      await formAssignment(db, actor, FIRST);
      await db
        .update(cohortAssignments)
        .set({ status: "submitted" })
        .where(eq(cohortAssignments.cohortYear, YEAR));

      const again = await formAssignment(db, actor, {
        ...FIRST,
        targetSize: 25,
        method: "by_nim",
        version: 1,
      });

      expect(again).toEqual({ ok: true, value: 2 });
      const draft = await draftOf(db);
      expect(draft).toMatchObject({
        status: "draft",
        targetSize: 25,
        method: "by_nim",
        version: 2,
      });
      expect(draft.groups).toHaveLength(2);
      expect(draft.groups.flatMap((group) => group.members)).toHaveLength(60);
      expect(draft.log.map((line) => line.action)).toEqual([
        "groups_reformed",
        "groups_formed",
      ]);
    });
  });

  it("refuses a form that was shown with an older draft, and changes nothing", async () => {
    await inTestDatabase(async (db) => {
      await addIntake(db);
      const actor = await addTestActor(db, ["upk_staff"]);
      await formAssignment(db, actor, FIRST);

      const stale = await formAssignment(db, actor, {
        ...FIRST,
        method: "by_nim",
      });

      expect(stale.ok).toBe(false);
      expect(await draftOf(db)).toMatchObject({
        method: "balanced",
        version: 1,
      });
    });
  });

  it("refuses a fixed angkatan", async () => {
    await inTestDatabase(async (db) => {
      await addIntake(db);
      const actor = await addTestActor(db, ["head_of_unit"]);
      await formAssignment(db, actor, FIRST);
      await db
        .update(cohortAssignments)
        .set({
          status: "fixed",
          decreeNumber: "KEP-UJI/2046",
          effectiveOn: "2046-09-01",
        })
        .where(eq(cohortAssignments.cohortYear, YEAR));

      const again = await formAssignment(db, actor, { ...FIRST, version: 1 });

      expect(again.ok).toBe(false);
      expect(await draftOf(db)).toMatchObject({ status: "fixed", version: 1 });
    });
  });

  it("refuses an angkatan where nobody waits for a group", async () => {
    await inTestDatabase(async (db) => {
      const actor = await addTestActor(db, ["upk_staff"]);

      const formed = await formAssignment(db, actor, FIRST);

      expect(formed.ok).toBe(false);
      expect(await readAssignment(db, EVERY_ROW, YEAR)).toBeNull();
    });
  });

  it.each<RoleId>(["director", "head_of_program", "mentor", "student"])(
    "refuses %s, and forms nothing",
    async (role) => {
      await inTestDatabase(async (db) => {
        await addIntake(db);
        const actor = await addTestActor(db, [role]);

        const formed = await formAssignment(db, actor, FIRST);

        expect(formed).toEqual({
          ok: false,
          error: "Anda tidak berhak menyiapkan penetapan angkatan baru.",
        });
        expect(await readAssignment(db, EVERY_ROW, YEAR)).toBeNull();
      });
    },
  );

  it.each<RoleId>(["head_of_unit", "upk_staff"])(
    "lets %s form the groups",
    async (role) => {
      await inTestDatabase(async (db) => {
        await addIntake(db);
        const actor = await addTestActor(db, [role]);

        expect((await formAssignment(db, actor, FIRST)).ok).toBe(true);
      });
    },
  );
});
