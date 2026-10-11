import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { accountsInRoleOrder } from "@/auth/accounts";
import { ROLE_IDS, type RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { accounts, roleChanges, students } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import {
  countStudents,
  findAddedStudent,
  listAddedStudents,
} from "./added-students";
import { changeStudent, NOT_FOUND, removeStudent } from "./change-student";
import { inputStudent, NOT_ALLOWED } from "./input-student";
import type { StudentInput } from "./student-input";
import {
  addTestActor,
  addTestProgram,
  addTestStudent,
  type TestActor,
} from "./test-records";

const inTestDatabase = withTestDatabase();

const ALLOWED: RoleId[] = ["head_of_unit", "upk_staff", "dorm_manager"];
const OTHERS = ROLE_IDS.filter((role) => !ALLOWED.includes(role));

function student(nim: string, studyProgramId: number): StudentInput {
  return {
    nim,
    name: "Ubah Uji",
    studyProgramId,
    entryPath: "regular",
    sex: "female",
    cohortYear: 2026,
    className: null,
    province: null,
    originAgency: null,
    status: "active",
    isAffirmation: false,
    isSeedling: false,
    isInternational: false,
    isBlended: false,
  };
}

/** A student put in through the tab by a staff account, with that account. */
async function addThroughTab(
  db: Database,
  nim: string,
): Promise<{ staff: TestActor; program: number }> {
  const program = await addTestProgram(db, `Prodi Uji ${nim}`);
  const staff = await addTestActor(db, "Pegawai Uji", ["upk_staff"]);
  const added = await inputStudent(db, staff, student(nim, program));
  if (!added.ok) throw new Error(added.error);
  return { staff, program };
}

async function recordOf(db: Database, nim: string) {
  const [found] = await db.select().from(students).where(eq(students.nim, nim));
  if (!found) throw new Error("The student record is gone.");
  return found;
}

async function accountOf(db: Database, studentId: string) {
  const [found] = await db
    .select()
    .from(accounts)
    .where(eq(accounts.studentId, studentId));
  if (!found) throw new Error("The student account is gone.");
  return found;
}

describe("findAddedStudent", () => {
  it("gives the data of a student put in through the tab", async () => {
    await inTestDatabase(async (db) => {
      const { program } = await addThroughTab(db, "9900000501");

      const found = await findAddedStudent(db, "9900000501");

      expect(found).toEqual(student("9900000501", program));
    });
  });

  it("gives nothing for a student of the first records", async () => {
    await inTestDatabase(async (db) => {
      const program = await addTestProgram(db, "Prodi Uji Induk");
      await addTestStudent(db, program, { nim: "9900000502", name: "Induk" });

      expect(await findAddedStudent(db, "9900000502")).toBeNull();
    });
  });
});

describe("changeStudent", () => {
  it.each(ALLOWED)("lets %s change a student", async (role) => {
    await inTestDatabase(async (db) => {
      const { program } = await addThroughTab(db, "9900000503");
      const editor = await addTestActor(db, "Pengubah Uji", [role]);
      const changed: StudentInput = {
        ...student("9900000503", program),
        name: "Ubah Uji Baru",
        entryPath: "transfer",
        sex: "male",
        cohortYear: 2025,
        className: "2-03",
        province: "Bali",
        originAgency: "Direktorat Jenderal Pajak",
        status: "on_leave",
        isBlended: true,
      };

      const done = await changeStudent(db, editor, changed);

      expect(done.ok).toBe(true);
      const record = await recordOf(db, "9900000503");
      expect(record).toMatchObject({
        ...changed,
        inputBy: editor.id,
        inputSource: "edit",
      });
      expect((await accountOf(db, record.id)).name).toBe("Ubah Uji Baru");
    });
  });

  it("refuses a role without the right, and changes nothing", async () => {
    await inTestDatabase(async (db) => {
      const { program, staff } = await addThroughTab(db, "9900000504");
      const other = await addTestActor(db, "Tanpa Hak Uji", OTHERS);

      const done = await changeStudent(db, other, {
        ...student("9900000504", program),
        name: "Tidak Boleh",
      });

      expect(done).toEqual(NOT_ALLOWED);
      expect(await recordOf(db, "9900000504")).toMatchObject({
        name: "Ubah Uji",
        inputBy: staff.id,
        inputSource: "form",
      });
    });
  });

  it("refuses a student of the first records and a removed student", async () => {
    await inTestDatabase(async (db) => {
      const { program, staff } = await addThroughTab(db, "9900000505");
      await addTestStudent(db, program, { nim: "9900000506", name: "Induk" });
      await removeStudent(db, staff, "9900000505");

      const first = await changeStudent(db, staff, {
        ...student("9900000506", program),
        name: "Tidak Boleh",
      });
      const removed = await changeStudent(db, staff, {
        ...student("9900000505", program),
        name: "Tidak Boleh",
      });

      expect(first).toEqual(NOT_FOUND);
      expect(removed).toEqual(NOT_FOUND);
      expect((await recordOf(db, "9900000506")).name).toBe("Induk");
      expect((await recordOf(db, "9900000505")).name).toBe("Ubah Uji");
    });
  });
});

describe("removeStudent", () => {
  it.each(ALLOWED)(
    "lets %s remove a student, who is marked and not erased",
    async (role) => {
      await inTestDatabase(async (db) => {
        await addThroughTab(db, "9900000507");
        const remover = await addTestActor(db, "Penghapus Uji", [role]);
        const before = await countStudents(db);

        const removed = await removeStudent(db, remover, "9900000507");

        expect(removed).toEqual({ ok: true, value: "Ubah Uji" });
        const record = await recordOf(db, "9900000507");
        expect(record.deletedBy).toBe(remover.id);
        expect(record.deletedAt).toBeInstanceOf(Date);
        const listed = await listAddedStudents(db, "9900000507");
        expect(listed).toEqual({ students: [], matching: 0 });
        expect(await countStudents(db)).toEqual({
          total: before.total - 1,
          active: before.active - 1,
          added: before.added - 1,
          addedActive: before.addedActive - 1,
        });
      });
    },
  );

  it("takes the student's account out of Ganti peran, keeps it, and logs it", async () => {
    await inTestDatabase(async (db) => {
      const { staff } = await addThroughTab(db, "9900000508");
      const record = await recordOf(db, "9900000508");

      await removeStudent(db, staff, "9900000508");

      const account = await accountOf(db, record.id);
      expect(account.deletedBy).toBe(staff.id);
      expect(account.deletedAt).toBeInstanceOf(Date);
      const switchable = await accountsInRoleOrder(db);
      expect(switchable.map((one) => one.id)).not.toContain(account.id);
      const log = await db
        .select()
        .from(roleChanges)
        .where(eq(roleChanges.accountId, account.id));
      expect(log.map((line) => line.action).sort()).toEqual([
        "added",
        "removed",
      ]);
      expect(log.find((line) => line.action === "removed")).toMatchObject({
        changedBy: staff.id,
        rolesBefore: ["student"],
        rolesAfter: [],
      });
    });
  });

  it("refuses a role without the right, and removes nothing", async () => {
    await inTestDatabase(async (db) => {
      await addThroughTab(db, "9900000509");
      const other = await addTestActor(db, "Tanpa Hak Uji", OTHERS);

      const removed = await removeStudent(db, other, "9900000509");

      expect(removed).toEqual(NOT_ALLOWED);
      const record = await recordOf(db, "9900000509");
      expect(record.deletedAt).toBeNull();
      expect((await accountOf(db, record.id)).deletedAt).toBeNull();
    });
  });

  it("refuses a student of the first records and one already removed", async () => {
    await inTestDatabase(async (db) => {
      const { program, staff } = await addThroughTab(db, "9900000510");
      await addTestStudent(db, program, { nim: "9900000511", name: "Induk" });
      await removeStudent(db, staff, "9900000510");

      expect(await removeStudent(db, staff, "9900000511")).toEqual(NOT_FOUND);
      expect(await removeStudent(db, staff, "9900000510")).toEqual(NOT_FOUND);
      expect((await recordOf(db, "9900000511")).deletedAt).toBeNull();
    });
  });
});
