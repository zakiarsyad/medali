import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { rolesByAccount } from "@/auth/accounts";
import { ROLE_IDS, type RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { accounts, students } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { changeBamRoles, removeBamRoles } from "./change-bam-roles";
import { listBamStudents } from "./list-bam-students";
import {
  addTestManager,
  addTestProgram,
  addTestStudentAccount,
  roleLogOf,
  type TestStudent,
} from "./test-records";

const inTestDatabase = withTestDatabase();

const PROGRAM = "Prodi Uji Ubah BAM";
const DEWI = { nim: "9912800401", name: "Dewi Uji Ubah" };
const HELD: RoleId[] = ["student", "bam_bphk", "bam_health"];
const NOT_ALLOWED = {
  ok: false,
  error: "Anda tidak berhak mengelola pengguna dan peran.",
};
const OTHER_ROLES = ROLE_IDS.filter((role) => role !== "head_of_unit");

async function addDewi(
  db: Database,
  more: Partial<TestStudent> = {},
): Promise<string> {
  const program = await addTestProgram(db, PROGRAM);
  return addTestStudentAccount(db, program, { ...DEWI, ...more }, HELD);
}

async function savedRoles(db: Database, accountId: string): Promise<RoleId[]> {
  const roles = await rolesByAccount(db, [accountId]);
  return roles.get(accountId) ?? [];
}

describe("changeBamRoles", () => {
  it("replaces the BAM roles, keeps Mahasiswa, and logs who and what", async () => {
    await inTestDatabase(async (db) => {
      const manager = await addTestManager(db);
      const accountId = await addDewi(db);

      const changed = await changeBamRoles(db, manager, {
        accountId,
        roles: ["bam_catering", "bam_bphk"],
      });

      expect(changed).toEqual({ ok: true, value: DEWI.name });
      expect(await savedRoles(db, accountId)).toEqual([
        "student",
        "bam_bphk",
        "bam_catering",
      ]);
      const [line, ...more] = await roleLogOf(db, accountId);
      expect(more).toEqual([]);
      expect(line).toMatchObject({
        changedBy: manager.id,
        action: "roles_changed",
        rolesBefore: ["student", "bam_bphk", "bam_health"],
        rolesAfter: ["student", "bam_bphk", "bam_catering"],
      });
      expect(line?.changedAt).toBeInstanceOf(Date);
    });
  });

  it("writes no log line when the ticks stay the same", async () => {
    await inTestDatabase(async (db) => {
      const manager = await addTestManager(db);
      const accountId = await addDewi(db);

      await changeBamRoles(db, manager, {
        accountId,
        roles: ["bam_health", "bam_bphk"],
      });

      expect(await roleLogOf(db, accountId)).toEqual([]);
    });
  });

  it("refuses to leave no BAM role: that is what Hapus is for", async () => {
    await inTestDatabase(async (db) => {
      const manager = await addTestManager(db);
      const accountId = await addDewi(db);

      const changed = await changeBamRoles(db, manager, {
        accountId,
        roles: [],
      });

      expect(changed).toEqual({
        ok: false,
        error: "Pilih minimal satu peran.",
      });
      expect(await savedRoles(db, accountId)).toEqual(HELD);
    });
  });

  it.each([
    ["on Cuti", { status: "on_leave" }],
    ["Non aktif", { status: "inactive" }],
    ["removed", { deletedAt: new Date() }],
  ] as const)("refuses a student who is %s", async (_kind, more) => {
    await inTestDatabase(async (db) => {
      const manager = await addTestManager(db);
      const accountId = await addDewi(db, more);

      const changed = await changeBamRoles(db, manager, {
        accountId,
        roles: ["bam_catering"],
      });

      expect(changed.ok).toBe(false);
      expect(await savedRoles(db, accountId)).toEqual(HELD);
      expect(await roleLogOf(db, accountId)).toEqual([]);
    });
  });

  it.each(OTHER_ROLES)(
    "refuses a hand-made change sent by %s",
    async (role) => {
      await inTestDatabase(async (db) => {
        const sender = await addTestManager(db, [role]);
        const accountId = await addDewi(db);

        const changed = await changeBamRoles(db, sender, {
          accountId,
          roles: ["bam_catering"],
        });

        expect(changed).toEqual(NOT_ALLOWED);
        expect(await savedRoles(db, accountId)).toEqual(HELD);
      });
    },
  );
});

describe("removeBamRoles", () => {
  it("takes every BAM role away, and keeps the student and Mahasiswa", async () => {
    await inTestDatabase(async (db) => {
      const manager = await addTestManager(db);
      const accountId = await addDewi(db);

      const removed = await removeBamRoles(db, manager, accountId);

      expect(removed).toEqual({ ok: true, value: DEWI.name });
      expect(await savedRoles(db, accountId)).toEqual(["student"]);
      expect((await listBamStudents(db, 0)).students).toEqual([]);
      const [account] = await db
        .select()
        .from(accounts)
        .where(eq(accounts.id, accountId));
      expect(account?.deletedAt).toBeNull();
      const [student] = await db
        .select()
        .from(students)
        .where(eq(students.nim, DEWI.nim));
      expect(student?.deletedAt).toBeNull();
    });
  });

  it("logs who took the roles away, with the roles before and after", async () => {
    await inTestDatabase(async (db) => {
      const manager = await addTestManager(db);
      const accountId = await addDewi(db);

      await removeBamRoles(db, manager, accountId);

      const [line, ...more] = await roleLogOf(db, accountId);
      expect(more).toEqual([]);
      expect(line).toMatchObject({
        changedBy: manager.id,
        action: "roles_changed",
        rolesBefore: ["student", "bam_bphk", "bam_health"],
        rolesAfter: ["student"],
      });
      expect(line?.changedAt).toBeInstanceOf(Date);
    });
  });

  it.each([
    ["on Cuti", { status: "on_leave" }],
    ["Non aktif", { status: "inactive" }],
    ["removed", { deletedAt: new Date() }],
  ] as const)("also works for a student who is %s", async (_kind, more) => {
    await inTestDatabase(async (db) => {
      const manager = await addTestManager(db);
      const accountId = await addDewi(db, more);

      const removed = await removeBamRoles(db, manager, accountId);

      expect(removed.ok).toBe(true);
      expect(await savedRoles(db, accountId)).toEqual(["student"]);
      expect((await listBamStudents(db, 0)).total).toBe(0);
    });
  });

  it("also works for an account removed with its student", async () => {
    await inTestDatabase(async (db) => {
      const manager = await addTestManager(db);
      const accountId = await addDewi(db, { deletedAt: new Date() });
      await db
        .update(accounts)
        .set({ deletedAt: new Date() })
        .where(eq(accounts.id, accountId));

      const removed = await removeBamRoles(db, manager, accountId);

      expect(removed.ok).toBe(true);
      expect(await savedRoles(db, accountId)).toEqual(["student"]);
    });
  });

  it("writes one log line when Hapus is sent twice", async () => {
    await inTestDatabase(async (db) => {
      const manager = await addTestManager(db);
      const accountId = await addDewi(db);

      await removeBamRoles(db, manager, accountId);
      const again = await removeBamRoles(db, manager, accountId);

      expect(again.ok).toBe(true);
      expect(await roleLogOf(db, accountId)).toHaveLength(1);
    });
  });

  it("leaves a staff account's BAM role alone", async () => {
    await inTestDatabase(async (db) => {
      const manager = await addTestManager(db);
      const staff = await addTestManager(db, ["bam_bphk"]);

      const removed = await removeBamRoles(db, manager, staff.id);

      expect(removed).toEqual({
        ok: false,
        error: "Mahasiswa tidak ditemukan.",
      });
      expect(await savedRoles(db, staff.id)).toEqual(["bam_bphk"]);
    });
  });

  it.each(OTHER_ROLES)(
    "refuses a hand-made change sent by %s",
    async (role) => {
      await inTestDatabase(async (db) => {
        const sender = await addTestManager(db, [role]);
        const accountId = await addDewi(db);

        const removed = await removeBamRoles(db, sender, accountId);

        expect(removed).toEqual(NOT_ALLOWED);
        expect(await savedRoles(db, accountId)).toEqual(HELD);
      });
    },
  );
});
