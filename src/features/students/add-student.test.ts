import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import {
  accountRoles,
  accounts,
  roleChanges,
  studyPrograms,
} from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { addStudent } from "./add-student";

const inTestDatabase = withTestDatabase();

async function addActor(db: Database): Promise<string> {
  const [actor] = await db
    .insert(accounts)
    .values({ name: "Pengelola Uji" })
    .returning();
  if (!actor) throw new Error("The account was not added.");
  return actor.id;
}

async function addProgram(db: Database): Promise<number> {
  const [program] = await db
    .insert(studyPrograms)
    .values({ name: "Prodi Uji Tambah" })
    .returning();
  if (!program) throw new Error("The study program was not added.");
  return program.id;
}

describe("addStudent", () => {
  it("gives the student an account with the student role, linked to the record", async () => {
    await inTestDatabase(async (db) => {
      const studyProgramId = await addProgram(db);
      const actor = await addActor(db);

      const added = await addStudent(
        db,
        {
          nim: "9900000101",
          name: "Mahasiswa Baru Uji",
          studyProgramId,
          entryPath: "regular",
          sex: "female",
          cohortYear: 2026,
        },
        actor,
      );

      const [account] = await db
        .select()
        .from(accounts)
        .where(eq(accounts.studentId, added.studentId));
      const roles = await db
        .select({ role: accountRoles.role })
        .from(accountRoles)
        .where(eq(accountRoles.accountId, added.accountId));

      expect(account?.id).toBe(added.accountId);
      expect(account?.name).toBe("Mahasiswa Baru Uji");
      expect(roles).toEqual([{ role: "student" }]);
    });
  });

  it("logs the student role as given, by whom", async () => {
    await inTestDatabase(async (db) => {
      const studyProgramId = await addProgram(db);
      const actor = await addActor(db);

      const added = await addStudent(
        db,
        {
          nim: "9900000102",
          name: "Mahasiswa Log Uji",
          studyProgramId,
          entryPath: "regular",
          sex: "male",
          cohortYear: 2026,
        },
        actor,
      );

      const lines = await db
        .select()
        .from(roleChanges)
        .where(eq(roleChanges.accountId, added.accountId));
      expect(lines).toMatchObject([
        {
          changedBy: actor,
          action: "added",
          rolesBefore: [],
          rolesAfter: ["student"],
        },
      ]);
    });
  });
});
