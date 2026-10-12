// Sample NIMs of this file: 9900000400 to 9900000499.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { accountsInRoleOrder } from "@/auth/accounts";
import { ROLE_IDS } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { accounts, students } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { listAddedStudents } from "./added-students";
import { inputStudent, NOT_ALLOWED } from "./input-student";
import type { StudentInput } from "./student-input";
import { addTestActor, addTestProgram, addTestStudent } from "./test-records";

const inTestDatabase = withTestDatabase();

function newStudent(nim: string, studyProgramId: number): StudentInput {
  return {
    nim,
    name: "Masuk Uji",
    studyProgramId,
    entryPath: "transfer",
    sex: "male",
    cohortYear: 2026,
    className: "1-02",
    province: "Riau",
    originAgency: "Direktorat Jenderal Pajak",
    status: "active",
    isAffirmation: false,
    isSeedling: true,
    isInternational: false,
    isBlended: false,
  };
}

async function studentWithNim(db: Database, nim: string) {
  const [found] = await db.select().from(students).where(eq(students.nim, nim));
  return found;
}

describe("inputStudent", () => {
  it.each(["head_of_unit", "upk_staff", "dorm_manager"] as const)(
    "lets %s add a student, kept with who put it in, when and how",
    async (role) => {
      await inTestDatabase(async (db) => {
        const program = await addTestProgram(db, "Prodi Uji Masuk");
        const actor = await addTestActor(db, "Pegawai Uji", [role]);
        const student = newStudent("9900000401", program);

        const added = await inputStudent(db, actor, student);

        expect(added.ok).toBe(true);
        const kept = await studentWithNim(db, "9900000401");
        expect(kept).toMatchObject({
          ...student,
          inputBy: actor.id,
          inputSource: "form",
          deletedAt: null,
        });
        expect(kept?.inputAt).toBeInstanceOf(Date);
      });
    },
  );

  it("gives the student an account that shows in Ganti peran, and lists the student first", async () => {
    await inTestDatabase(async (db) => {
      const program = await addTestProgram(db, "Prodi Uji Akun");
      const actor = await addTestActor(db, "Pegawai Uji", ["upk_staff"]);
      await addTestStudent(db, program, {
        nim: "9900000402",
        name: "Masuk Uji Lama",
        inputAt: new Date("2026-01-01T00:00:00Z"),
        inputBy: actor.id,
        inputSource: "form",
      });

      await inputStudent(db, actor, newStudent("9900000403", program));

      const kept = await studentWithNim(db, "9900000403");
      const switchable = await accountsInRoleOrder(db);
      const account = switchable.find((one) => one.studentId === kept?.id);
      expect(account).toMatchObject({ name: "Masuk Uji", roles: ["student"] });
      const listed = await listAddedStudents(db, "Masuk Uji");
      expect(listed.students.map((student) => student.nim)).toEqual([
        "9900000403",
        "9900000402",
      ]);
    });
  });

  it("refuses a NIM that is already used, and saves nothing", async () => {
    await inTestDatabase(async (db) => {
      const program = await addTestProgram(db, "Prodi Uji Kembar");
      const actor = await addTestActor(db, "Pegawai Uji", ["upk_staff"]);
      await addTestStudent(db, program, { nim: "9900000404", name: "Induk" });
      const before = await db.select({ id: accounts.id }).from(accounts);

      const added = await inputStudent(
        db,
        actor,
        newStudent("9900000404", program),
      );

      expect(added).toEqual({
        ok: false,
        error: "NIM 9900000404 sudah terdaftar.",
      });
      const kept = await studentWithNim(db, "9900000404");
      expect(kept?.name).toBe("Induk");
      const after = await db.select({ id: accounts.id }).from(accounts);
      expect(after).toHaveLength(before.length);
    });
  });

  it("refuses every role without the right, and saves nothing", async () => {
    await inTestDatabase(async (db) => {
      const program = await addTestProgram(db, "Prodi Uji Tolak");
      const allowed = ["head_of_unit", "upk_staff", "dorm_manager"];
      const others = ROLE_IDS.filter((role) => !allowed.includes(role));
      const actor = await addTestActor(db, "Tanpa Hak Uji", others);
      const before = await db.select({ id: accounts.id }).from(accounts);

      const added = await inputStudent(
        db,
        actor,
        newStudent("9900000405", program),
      );

      expect(added).toEqual(NOT_ALLOWED);
      expect(await studentWithNim(db, "9900000405")).toBeUndefined();
      const after = await db.select({ id: accounts.id }).from(accounts);
      expect(after).toHaveLength(before.length);
    });
  });
});
