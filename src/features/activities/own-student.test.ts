import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { students } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { readOwnStudent } from "./own-student";
import { addTestProgram, addTestStudentAccount } from "./test-records";

/*
 * This file's own sample values: the program UJIMHSSENDIRI and the NIMs
 * 9972200000 to 9972200099.
 */

const inTestDatabase = withTestDatabase();

const STUDENT = {
  nim: "9972200001",
  name: "Mahasiswa Uji Sendiri",
  cohortYear: 2159,
  className: "MS-01",
};

describe("readOwnStudent", () => {
  it("gives a student account its own student", async () => {
    await inTestDatabase(async (db) => {
      const programId = await addTestProgram(db, "UJIMHSSENDIRI");
      const account = await addTestStudentAccount(db, programId, STUDENT);

      expect(await readOwnStudent(db, account)).toEqual({
        id: account.studentId,
        cohortYear: 2159,
        className: "MS-01",
        isActive: true,
      });
    });
  });

  it("gives the same student, and no more, to a student who also holds a role that sees every student", async () => {
    await inTestDatabase(async (db) => {
      const programId = await addTestProgram(db, "UJIMHSSENDIRI");
      const account = await addTestStudentAccount(db, programId, STUDENT);
      const both = { ...account, roles: ["bam_bphk", "student"] as const };

      expect((await readOwnStudent(db, both))?.id).toBe(account.studentId);
    });
  });

  it.each([
    ["Pegawai UPK", ["upk_staff"]],
    ["Kepala Unit", ["head_of_unit"]],
    ["Pengasuh", ["mentor"]],
    ["an account with no role", []],
  ] as const)(
    "gives %s none, even with a student record",
    async (_who, roles) => {
      await inTestDatabase(async (db) => {
        const programId = await addTestProgram(db, "UJIMHSSENDIRI");
        const account = await addTestStudentAccount(db, programId, STUDENT);

        expect(await readOwnStudent(db, { ...account, roles })).toBeNull();
      });
    },
  );

  it("gives none to a student account without a student record, or with a removed one", async () => {
    await inTestDatabase(async (db) => {
      const programId = await addTestProgram(db, "UJIMHSSENDIRI");
      const account = await addTestStudentAccount(db, programId, STUDENT);
      const noRecord = { ...account, studentId: null };

      expect(await readOwnStudent(db, noRecord)).toBeNull();

      await db
        .update(students)
        .set({ deletedAt: new Date() })
        .where(eq(students.id, account.studentId));

      expect(await readOwnStudent(db, account)).toBeNull();
    });
  });

  it("tells a student on Cuti from an Aktif one", async () => {
    await inTestDatabase(async (db) => {
      const programId = await addTestProgram(db, "UJIMHSSENDIRI");
      const account = await addTestStudentAccount(db, programId, {
        ...STUDENT,
        status: "on_leave",
      });

      expect((await readOwnStudent(db, account))?.isActive).toBe(false);
    });
  });
});
