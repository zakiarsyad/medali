import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import {
  accountRoles,
  accounts,
  roleChanges,
  students,
  studyPrograms,
} from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { addStudent, addStudents } from "./add-student";

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
  it("adds nothing when the NIM is already used", async () => {
    await inTestDatabase(async (db) => {
      const studyProgramId = await addProgram(db);
      const actor = await addActor(db);
      const student = {
        nim: "9900000103",
        name: "Mahasiswa Pertama Uji",
        studyProgramId,
        entryPath: "regular" as const,
        sex: "female" as const,
        cohortYear: 2026,
      };
      await addStudent(db, student, actor);
      const before = await db.select({ id: accounts.id }).from(accounts);

      const again = await addStudent(
        db,
        { ...student, name: "Mahasiswa Kedua Uji" },
        actor,
      );

      expect(again).toBeNull();
      const after = await db.select({ id: accounts.id }).from(accounts);
      expect(after).toHaveLength(before.length);
      const kept = await db
        .select({ name: students.name })
        .from(students)
        .where(eq(students.nim, student.nim));
      expect(kept).toEqual([{ name: "Mahasiswa Pertama Uji" }]);
    });
  });

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
      if (!added) throw new Error("The student was not added.");

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
      if (!added) throw new Error("The student was not added.");

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

describe("addStudents", () => {
  it("adds many students whole, and leaves out a NIM that is already used", async () => {
    await inTestDatabase(async (db) => {
      const studyProgramId = await addProgram(db);
      const actor = await addActor(db);
      const student = (nim: string, name: string) => ({
        nim,
        name,
        studyProgramId,
        entryPath: "regular" as const,
        sex: "female" as const,
        cohortYear: 2026,
      });
      await addStudent(db, student("9900000111", "Mahasiswa Lama Uji"), actor);
      const accountsBefore = await db.$count(accounts);
      const linesBefore = await db.$count(roleChanges);

      const added = await addStudents(
        db,
        [
          student("9900000110", "Mahasiswa Banyak Satu"),
          student("9900000111", "Mahasiswa Banyak Dua"),
          student("9900000112", "Mahasiswa Banyak Tiga"),
        ],
        actor,
      );

      expect(added).toHaveLength(2);
      expect(await db.$count(accounts)).toBe(accountsBefore + 2);
      expect(await db.$count(roleChanges)).toBe(linesBefore + 2);
      const kept = await db
        .select({ name: students.name })
        .from(students)
        .where(eq(students.nim, "9900000111"));
      expect(kept).toEqual([{ name: "Mahasiswa Lama Uji" }]);
      for (const { accountId, studentId } of added) {
        const [account] = await db
          .select({ studentId: accounts.studentId })
          .from(accounts)
          .where(eq(accounts.id, accountId));
        const roles = await db
          .select({ role: accountRoles.role })
          .from(accountRoles)
          .where(eq(accountRoles.accountId, accountId));
        expect(account?.studentId).toBe(studentId);
        expect(roles).toEqual([{ role: "student" }]);
      }
    });
  });

  it("adds nothing when given no students", async () => {
    await inTestDatabase(async (db) => {
      const actor = await addActor(db);

      expect(await addStudents(db, [], actor)).toEqual([]);
    });
  });
});
