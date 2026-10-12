import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { findActiveAccount, rolesByAccount } from "@/auth/accounts";
import { ROLE_IDS, type RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { accounts } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { giveBamRoles } from "./give-bam-roles";
import {
  addTestManager,
  addTestProgram,
  addTestStudentAccount,
  roleLogOf,
  type TestStudent,
} from "./test-records";

const inTestDatabase = withTestDatabase();

const PROGRAM = "Prodi Uji Beri BAM";
const SARI = { nim: "9912800001", name: "Sari Uji Beri" };
const NOT_ACTIVE = {
  ok: false,
  error: "Mahasiswa tidak ditemukan atau tidak aktif. Pilih mahasiswa lain.",
};

async function addSari(
  db: Database,
  more: Partial<TestStudent> = {},
): Promise<string> {
  const program = await addTestProgram(db, PROGRAM);
  return addTestStudentAccount(db, program, { ...SARI, ...more });
}

async function savedRoles(db: Database, accountId: string): Promise<RoleId[]> {
  const roles = await rolesByAccount(db, [accountId]);
  return roles.get(accountId) ?? [];
}

describe("giveBamRoles", () => {
  it("gives a student BAM roles beside Mahasiswa, and logs who and what", async () => {
    await inTestDatabase(async (db) => {
      const manager = await addTestManager(db);
      const accountId = await addSari(db);

      const given = await giveBamRoles(db, manager, {
        accountId,
        roles: ["bam_health", "bam_bphk"],
      });

      expect(given).toEqual({ ok: true, value: SARI.name });
      const account = await findActiveAccount(db, accountId);
      expect(account?.roles).toEqual(["student", "bam_bphk", "bam_health"]);
      const [line, ...more] = await roleLogOf(db, accountId);
      expect(more).toEqual([]);
      expect(line).toMatchObject({
        changedBy: manager.id,
        action: "roles_changed",
        rolesBefore: ["student"],
        rolesAfter: ["student", "bam_bphk", "bam_health"],
      });
      expect(line?.changedAt).toBeInstanceOf(Date);
    });
  });

  it("keeps one set of rows and one log line when the same is given twice", async () => {
    await inTestDatabase(async (db) => {
      const manager = await addTestManager(db);
      const accountId = await addSari(db);
      const change = { accountId, roles: ["bam_bphk" as const] };

      await giveBamRoles(db, manager, change);
      const again = await giveBamRoles(db, manager, change);

      expect(again.ok).toBe(true);
      expect(await savedRoles(db, accountId)).toEqual(["student", "bam_bphk"]);
      expect(await roleLogOf(db, accountId)).toHaveLength(1);
    });
  });

  it("adds to the BAM roles the student already holds", async () => {
    await inTestDatabase(async (db) => {
      const manager = await addTestManager(db);
      const accountId = await addSari(db);
      await giveBamRoles(db, manager, { accountId, roles: ["bam_bphk"] });

      await giveBamRoles(db, manager, { accountId, roles: ["bam_catering"] });

      expect(await savedRoles(db, accountId)).toEqual([
        "student",
        "bam_bphk",
        "bam_catering",
      ]);
    });
  });

  it.each([
    ["on Cuti", { status: "on_leave" }],
    ["Non aktif", { status: "inactive" }],
    ["removed", { deletedAt: new Date() }],
  ] as const)("refuses a student who is %s", async (_kind, more) => {
    await inTestDatabase(async (db) => {
      const manager = await addTestManager(db);
      const accountId = await addSari(db, more);

      const given = await giveBamRoles(db, manager, {
        accountId,
        roles: ["bam_bphk"],
      });

      expect(given).toEqual(NOT_ACTIVE);
      expect(await savedRoles(db, accountId)).toEqual(["student"]);
      expect(await roleLogOf(db, accountId)).toEqual([]);
    });
  });

  it("refuses a student whose account was removed", async () => {
    await inTestDatabase(async (db) => {
      const manager = await addTestManager(db);
      const accountId = await addSari(db);
      await db
        .update(accounts)
        .set({ deletedAt: new Date() })
        .where(eq(accounts.id, accountId));

      const given = await giveBamRoles(db, manager, {
        accountId,
        roles: ["bam_bphk"],
      });

      expect(given).toEqual(NOT_ACTIVE);
    });
  });

  it("refuses an account that is not a student's", async () => {
    await inTestDatabase(async (db) => {
      const manager = await addTestManager(db);
      const staff = await addTestManager(db, ["mentor"]);

      const given = await giveBamRoles(db, manager, {
        accountId: staff.id,
        roles: ["bam_bphk"],
      });

      expect(given).toEqual(NOT_ACTIVE);
      expect(await savedRoles(db, staff.id)).toEqual(["mentor"]);
    });
  });

  it.each(ROLE_IDS.filter((role) => role !== "head_of_unit"))(
    "refuses a hand-made change sent by %s",
    async (role) => {
      await inTestDatabase(async (db) => {
        const sender = await addTestManager(db, [role]);
        const accountId = await addSari(db);

        const given = await giveBamRoles(db, sender, {
          accountId,
          roles: ["bam_bphk"],
        });

        expect(given).toEqual({
          ok: false,
          error: "Anda tidak berhak mengelola pengguna dan peran.",
        });
        expect(await savedRoles(db, accountId)).toEqual(["student"]);
      });
    },
  );
});
