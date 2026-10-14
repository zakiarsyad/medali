// Sample NIMs of this file: 9900000500 to 9900000599.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import {
  accountsInRoleOrder,
  activeAccountIdByEmail,
  findActiveAccount,
} from "@/auth/accounts";
import { ROLE_IDS, type RoleId } from "@/auth/role-ids";
import { sessionAccount, startSession } from "@/auth/sessions";
import type { Database } from "@/db/connect";
import { accounts, emailChanges, roleChanges, students } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import {
  countStudents,
  findAddedStudent,
  listAddedStudents,
} from "./added-students";
import { NOT_FOUND, removeStudent } from "./change-student";
import { inputStudent, NOT_ALLOWED } from "./input-student";
import type { StudentInput } from "./student-input";
import { changeTestStudent } from "./test-changes";
import {
  addTestActor,
  addTestProgram,
  addTestStudent,
  type TestActor,
} from "./test-records";

const inTestDatabase = withTestDatabase();

const ALLOWED: RoleId[] = ["head_of_unit", "upk_staff", "dorm_manager"];
const OTHERS = ROLE_IDS.filter((role) => !ALLOWED.includes(role));
const NOW = new Date("2026-10-12T08:00:00Z");

/** The lines of the address change log for one account, each as a row. */
async function emailLinesOf(db: Database, accountId: string) {
  const lines = await db
    .select()
    .from(emailChanges)
    .where(eq(emailChanges.accountId, accountId));
  return lines.map((line) => [
    line.action,
    line.emailBefore,
    line.emailAfter,
    line.changedBy,
  ]);
}

function student(
  nim: string,
  studyProgramId: number,
  email: string | null = null,
): StudentInput {
  return {
    nim,
    name: "Ubah Uji",
    email,
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

      expect(found).toEqual({
        ...student("9900000501", program),
        mentorGroupId: null,
        version: 1,
      });
    });
  });

  it("gives the address the student's account holds", async () => {
    await inTestDatabase(async (db) => {
      const { program, staff } = await addThroughTab(db, "9900000521");
      await changeTestStudent(
        db,
        staff,
        student("9900000521", program, "ubah.uji@kampus.example"),
      );

      const found = await findAddedStudent(db, "9900000521");

      expect(found?.email).toBe("ubah.uji@kampus.example");
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
  it.each(ALLOWED)(
    "lets %s change a student, and keeps who put the student in, when and how",
    async (role) => {
      await inTestDatabase(async (db) => {
        const { program, staff } = await addThroughTab(db, "9900000503");
        const editor = await addTestActor(db, "Pengubah Uji", [role]);
        const before = await recordOf(db, "9900000503");
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

        const done = await changeTestStudent(db, editor, changed);

        expect(done.ok).toBe(true);
        const record = await recordOf(db, "9900000503");
        const { email: _onTheAccount, ...fields } = changed;
        expect(record).toMatchObject({
          ...fields,
          inputAt: before.inputAt,
          inputBy: staff.id,
          inputSource: "form",
        });
        expect((await accountOf(db, record.id)).name).toBe("Ubah Uji Baru");
      });
    },
  );

  it("adds an address, changes it and clears it on the student's account", async () => {
    await inTestDatabase(async (db) => {
      const { program, staff } = await addThroughTab(db, "9900000522");
      const record = await recordOf(db, "9900000522");
      const saveWith = (email: string | null) =>
        changeTestStudent(db, staff, student("9900000522", program, email));

      expect((await saveWith("satu.uji@kampus.example")).ok).toBe(true);
      expect((await accountOf(db, record.id)).email).toBe(
        "satu.uji@kampus.example",
      );
      expect((await saveWith("dua.uji@kampus.example")).ok).toBe(true);
      expect((await accountOf(db, record.id)).email).toBe(
        "dua.uji@kampus.example",
      );
      expect((await saveWith(null)).ok).toBe(true);
      expect((await accountOf(db, record.id)).email).toBeNull();
    });
  });

  it("keeps the address a student already has when the form sends it again", async () => {
    await inTestDatabase(async (db) => {
      const { program, staff } = await addThroughTab(db, "9900000523");
      const email = "tetap.uji@kampus.example";
      await changeTestStudent(db, staff, student("9900000523", program, email));

      const done = await changeTestStudent(db, staff, {
        ...student("9900000523", program, email),
        name: "Ubah Uji Tetap",
      });

      expect(done.ok).toBe(true);
      const record = await recordOf(db, "9900000523");
      expect(await accountOf(db, record.id)).toMatchObject({
        name: "Ubah Uji Tetap",
        email,
      });
    });
  });

  it.each([
    ["changed", "baru.uji@kampus.example"],
    ["cleared", null],
  ])(
    "ends the student's sign-ins at once when the address is %s, and the old address signs nobody in",
    async (_kind, after) => {
      await inTestDatabase(async (db) => {
        const { program, staff } = await addThroughTab(db, "9900000525");
        const before = "lama.uji@kampus.example";
        await changeTestStudent(
          db,
          staff,
          student("9900000525", program, before),
        );
        const record = await recordOf(db, "9900000525");
        const account = await accountOf(db, record.id);
        const token = await startSession(db, account.id, NOW);

        await changeTestStudent(
          db,
          staff,
          student("9900000525", program, after),
        );

        expect(await sessionAccount(db, token, NOW)).toBeNull();
        expect(await activeAccountIdByEmail(db, before)).toBeNull();
      });
    },
  );

  it("keeps the student signed in when the address stays as it is", async () => {
    await inTestDatabase(async (db) => {
      const { program, staff } = await addThroughTab(db, "9900000526");
      const email = "masuk.tetap@kampus.example";
      await changeTestStudent(db, staff, student("9900000526", program, email));
      const record = await recordOf(db, "9900000526");
      const account = await accountOf(db, record.id);
      const token = await startSession(db, account.id, NOW);

      await changeTestStudent(db, staff, {
        ...student("9900000526", program, email),
        name: "Ubah Uji Masuk",
      });

      expect((await sessionAccount(db, token, NOW))?.id).toBe(account.id);
      expect(await activeAccountIdByEmail(db, email)).toBe(account.id);
    });
  });

  it("refuses an address another account holds, and changes nothing", async () => {
    await inTestDatabase(async (db) => {
      const { program, staff } = await addThroughTab(db, "9900000524");
      const email = "dipakai.ubah@kampus.example";
      await db.insert(accounts).values({ name: "Pegawai Lain", email });

      const done = await changeTestStudent(db, staff, {
        ...student("9900000524", program, email),
        name: "Tidak Tersimpan",
      });

      expect(done).toEqual({
        ok: false,
        error: "Email sudah dipakai akun lain.",
      });
      const record = await recordOf(db, "9900000524");
      expect(record.name).toBe("Ubah Uji");
      expect(await accountOf(db, record.id)).toMatchObject({
        name: "Ubah Uji",
        email: null,
      });
    });
  });

  it("logs the address as added, changed and cleared, with who did it and the address before and after", async () => {
    await inTestDatabase(async (db) => {
      const { program } = await addThroughTab(db, "9900000527");
      const changer = await addTestActor(db, "Pengubah Uji", ["dorm_manager"]);
      const record = await recordOf(db, "9900000527");
      const account = await accountOf(db, record.id);
      const first = "catat.satu@kampus.example";
      const second = "catat.dua@kampus.example";
      const saveWith = (email: string | null) =>
        changeTestStudent(db, changer, student("9900000527", program, email));

      await saveWith(first);
      await saveWith(first);
      await saveWith(second);
      await saveWith(null);
      await saveWith(null);

      const lines = await emailLinesOf(db, account.id);
      expect(lines).toHaveLength(3);
      expect(lines).toEqual(
        expect.arrayContaining([
          ["added", null, first, changer.id],
          ["changed", first, second, changer.id],
          ["cleared", second, null, changer.id],
        ]),
      );
    });
  });

  it("writes no log line when the address is refused", async () => {
    await inTestDatabase(async (db) => {
      const { program, staff } = await addThroughTab(db, "9900000528");
      const email = "dipakai.catat@kampus.example";
      await db.insert(accounts).values({ name: "Pegawai Lain", email });
      const record = await recordOf(db, "9900000528");
      const account = await accountOf(db, record.id);

      await changeTestStudent(db, staff, student("9900000528", program, email));

      expect(await emailLinesOf(db, account.id)).toEqual([]);
    });
  });

  it("refuses an address sent by a role without the right, and neither saves nor logs it", async () => {
    await inTestDatabase(async (db) => {
      const { program } = await addThroughTab(db, "9900000529");
      const other = await addTestActor(db, "Tanpa Hak Uji", OTHERS);
      const record = await recordOf(db, "9900000529");
      const account = await accountOf(db, record.id);

      const done = await changeTestStudent(
        db,
        other,
        student("9900000529", program, "tanpa.hak@kampus.example"),
      );

      expect(done).toEqual(NOT_ALLOWED);
      expect((await accountOf(db, record.id)).email).toBeNull();
      expect(await emailLinesOf(db, account.id)).toEqual([]);
    });
  });

  it("refuses a student who sends an address for their own account", async () => {
    await inTestDatabase(async (db) => {
      const { program, staff } = await addThroughTab(db, "9900000530");
      const kept = "milik.uji@kampus.example";
      await changeTestStudent(db, staff, student("9900000530", program, kept));
      const record = await recordOf(db, "9900000530");
      const account = await accountOf(db, record.id);
      const [own] = (await accountsInRoleOrder(db)).filter(
        (one) => one.id === account.id,
      );
      if (!own) throw new Error("The student account is gone.");

      const done = await changeTestStudent(
        db,
        own,
        student("9900000530", program, "ganti.sendiri@kampus.example"),
      );

      expect(own.roles).toEqual(["student"]);
      expect(done).toEqual(NOT_ALLOWED);
      expect((await accountOf(db, record.id)).email).toBe(kept);
      expect(await emailLinesOf(db, account.id)).toHaveLength(1);
    });
  });

  it("refuses a role without the right, and changes nothing", async () => {
    await inTestDatabase(async (db) => {
      const { program, staff } = await addThroughTab(db, "9900000504");
      const other = await addTestActor(db, "Tanpa Hak Uji", OTHERS);

      const done = await changeTestStudent(db, other, {
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

  it("refuses a student who tries to change their own record, and changes nothing", async () => {
    await inTestDatabase(async (db) => {
      const { program } = await addThroughTab(db, "9900000512");
      const record = await recordOf(db, "9900000512");
      const { id } = await accountOf(db, record.id);
      const own = await findActiveAccount(db, id);
      if (!own) throw new Error("The student account is not active.");

      const done = await changeTestStudent(db, own, {
        ...student("9900000512", program),
        name: "Tidak Boleh",
      });

      expect(own.roles).toEqual(["student"]);
      expect(own.studentId).toBe(record.id);
      expect(done).toEqual(NOT_ALLOWED);
      expect((await recordOf(db, "9900000512")).name).toBe("Ubah Uji");
    });
  });

  it("refuses a student of the first records and a removed student", async () => {
    await inTestDatabase(async (db) => {
      const { program, staff } = await addThroughTab(db, "9900000505");
      await addTestStudent(db, program, { nim: "9900000506", name: "Induk" });
      await removeStudent(db, staff, "9900000505");

      const first = await changeTestStudent(db, staff, {
        ...student("9900000506", program),
        name: "Tidak Boleh",
      });
      const removed = await changeTestStudent(db, staff, {
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
        const before = await countStudents(db, []);

        const removed = await removeStudent(db, remover, "9900000507");

        expect(removed).toEqual({ ok: true, value: "Ubah Uji" });
        const record = await recordOf(db, "9900000507");
        expect(record.deletedBy).toBe(remover.id);
        expect(record.deletedAt).toBeInstanceOf(Date);
        const listed = await listAddedStudents(db, "9900000507", []);
        expect(listed).toEqual({ students: [], matching: 0, page: 1 });
        expect(await countStudents(db, [])).toEqual({
          total: before.total - 1,
          active: before.active - 1,
          added: before.added - 1,
          addedActive: before.addedActive - 1,
          addedResidents: before.addedResidents,
          addedWithoutGroup: before.addedWithoutGroup - 1,
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
