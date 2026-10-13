// Sample NIMs of this file: 9900000100 to 9900000199.
import { eq, inArray } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { EMAIL_IN_USE_RULE } from "@/auth/account-email";
import type { Database } from "@/db/connect";
import {
  accountRoles,
  accounts,
  emailChanges,
  roleChanges,
  students,
  studyPrograms,
} from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { brokeUniqueRule } from "@/db/unique-violation";
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
    .values({ name: "Prodi Uji Tambah", code: "Prodi Uji Tambah" })
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

      expect(added.map((student) => student.nim)).toEqual([
        "9900000110",
        "9900000112",
      ]);
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

describe("the campus address of a student account", () => {
  function student(nim: string, studyProgramId: number, email: string | null) {
    return {
      nim,
      name: "Mahasiswa Alamat Uji",
      studyProgramId,
      entryPath: "regular" as const,
      sex: "female" as const,
      cohortYear: 2026,
      email,
    };
  }

  async function emailOf(db: Database, accountId: string) {
    const [account] = await db
      .select({ email: accounts.email })
      .from(accounts)
      .where(eq(accounts.id, accountId));
    return account?.email;
  }

  it("is kept on the account of the student, and nowhere when there is none", async () => {
    await inTestDatabase(async (db) => {
      const program = await addProgram(db);
      const actor = await addActor(db);

      const [withOne, without] = await addStudents(
        db,
        [
          student("9900000111", program, "alamat.satu@kampus.example"),
          student("9900000112", program, null),
        ],
        actor,
      );
      if (!withOne || !without) throw new Error("A student was not added.");

      expect(await emailOf(db, withOne.accountId)).toBe(
        "alamat.satu@kampus.example",
      );
      expect(await emailOf(db, without.accountId)).toBeNull();
    });
  });

  it("is logged as added, by whom, and a student without one gets no line", async () => {
    await inTestDatabase(async (db) => {
      const program = await addProgram(db);
      const actor = await addActor(db);

      const [withOne, without] = await addStudents(
        db,
        [
          student("9900000116", program, "catat.satu@kampus.example"),
          student("9900000117", program, null),
        ],
        actor,
      );
      if (!withOne || !without) throw new Error("A student was not added.");

      const lines = await db
        .select()
        .from(emailChanges)
        .where(
          inArray(emailChanges.accountId, [
            withOne.accountId,
            without.accountId,
          ]),
        );
      expect(lines).toHaveLength(1);
      expect(lines[0]).toMatchObject({
        accountId: withOne.accountId,
        changedBy: actor,
        action: "added",
        emailBefore: null,
        emailAfter: "catat.satu@kampus.example",
      });
      expect(lines[0]?.changedAt).toBeInstanceOf(Date);
    });
  });

  it("is refused by the database when a staff account holds it, and the student is not added", async () => {
    await inTestDatabase(async (db) => {
      const program = await addProgram(db);
      const actor = await addActor(db);
      await db
        .insert(accounts)
        .values({ name: "Pegawai Uji", email: "dipakai@kampus.example" });

      const adding = addStudent(
        db,
        student("9900000113", program, "dipakai@kampus.example"),
        actor,
      );

      await expect(adding).rejects.toSatisfy((error) =>
        brokeUniqueRule(error, EMAIL_IN_USE_RULE),
      );
      const kept = await db
        .select({ id: students.id })
        .from(students)
        .where(eq(students.nim, "9900000113"));
      expect(kept).toEqual([]);
    });
  });

  it("is refused by the database when another student's account holds it", async () => {
    await inTestDatabase(async (db) => {
      const program = await addProgram(db);
      const actor = await addActor(db);
      await addStudent(
        db,
        student("9900000114", program, "berdua@kampus.example"),
        actor,
      );

      const adding = addStudent(
        db,
        student("9900000115", program, "berdua@kampus.example"),
        actor,
      );

      await expect(adding).rejects.toSatisfy((error) =>
        brokeUniqueRule(error, EMAIL_IN_USE_RULE),
      );
    });
  });
});
