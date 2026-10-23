import { count, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { rolesByAccount } from "@/auth/accounts";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { accountRoles, accounts, roleChanges } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { handOverHeadOfUnit } from "./hand-over-head-of-unit";
import {
  addTestProgram,
  addTestStaffAccount,
  addTestStudentAccount,
  roleLogOf,
} from "./test-records";

const inTestDatabase = withTestDatabase();

const PROGRAM = "Prodi Uji Serah Kepala";

async function rolesOf(db: Database, accountId: string): Promise<RoleId[]> {
  const roles = await rolesByAccount(db, [accountId]);
  return roles.get(accountId) ?? [];
}

async function removalOf(db: Database, accountId: string) {
  const [found] = await db
    .select({ deletedAt: accounts.deletedAt, deletedBy: accounts.deletedBy })
    .from(accounts)
    .where(eq(accounts.id, accountId));
  return found;
}

async function totals(db: Database) {
  const [inRoles] = await db.select({ total: count() }).from(accountRoles);
  const [inLog] = await db.select({ total: count() }).from(roleChanges);
  const [removed] = await db
    .select({ total: count(accounts.deletedAt) })
    .from(accounts);
  return [inRoles?.total, inLog?.total, removed?.total];
}

describe("handOverHeadOfUnit", () => {
  it("moves Kepala Unit to the chosen account, both keep their other roles, and logs both", async () => {
    await inTestDatabase(async (db) => {
      const head = await addTestStaffAccount(db, "Kepala Uji Serah", [
        "head_of_unit",
        "mentor",
      ]);
      const next = await addTestStaffAccount(db, "Staf Uji Penerima", [
        "counsellor",
      ]);

      const handed = await handOverHeadOfUnit(db, next, head);

      expect(handed).toEqual({ ok: true, value: null });
      expect(await rolesOf(db, next)).toEqual(["head_of_unit", "counsellor"]);
      expect(await rolesOf(db, head)).toEqual(["mentor"]);
      expect((await removalOf(db, head))?.deletedAt).toBeNull();
      expect(await roleLogOf(db, next)).toMatchObject([
        {
          changedBy: head,
          action: "roles_changed",
          rolesBefore: ["counsellor"],
          rolesAfter: ["head_of_unit", "counsellor"],
        },
      ]);
      expect(await roleLogOf(db, head)).toMatchObject([
        {
          changedBy: head,
          action: "roles_changed",
          rolesBefore: ["head_of_unit", "mentor"],
          rolesAfter: ["mentor"],
        },
      ]);
    });
  });

  it("marks the one who handed over removed when they had no other role", async () => {
    await inTestDatabase(async (db) => {
      const head = await addTestStaffAccount(db, "Kepala Uji Pergi", [
        "head_of_unit",
      ]);
      const next = await addTestStaffAccount(db, "Staf Uji Pengganti", [
        "director",
      ]);

      const handed = await handOverHeadOfUnit(db, next, head);

      expect(handed.ok).toBe(true);
      expect(await rolesOf(db, next)).toEqual(["head_of_unit", "director"]);
      const removal = await removalOf(db, head);
      expect(removal?.deletedAt).not.toBeNull();
      expect(removal?.deletedBy).toBe(head);
      expect(await roleLogOf(db, head)).toMatchObject([
        {
          changedBy: head,
          action: "removed",
          rolesBefore: ["head_of_unit"],
          rolesAfter: [],
        },
      ]);
    });
  });

  it("refuses an account that was removed meanwhile, and changes nothing", async () => {
    await inTestDatabase(async (db) => {
      const head = await addTestStaffAccount(db, "Kepala Uji", [
        "head_of_unit",
      ]);
      const gone = await addTestStaffAccount(db, "Staf Uji Dihapus", [
        "mentor",
      ]);
      await db
        .update(accounts)
        .set({ deletedAt: new Date(), deletedBy: head })
        .where(eq(accounts.id, gone));
      const before = await totals(db);

      const handed = await handOverHeadOfUnit(db, gone, head);

      expect(handed).toEqual({ ok: false, error: "Akun tidak ditemukan." });
      expect(await totals(db)).toEqual(before);
    });
  });

  it("refuses an account that became Kepala Unit meanwhile, and changes nothing", async () => {
    await inTestDatabase(async (db) => {
      const head = await addTestStaffAccount(db, "Kepala Uji", [
        "head_of_unit",
      ]);
      const other = await addTestStaffAccount(db, "Kepala Uji Lain", [
        "head_of_unit",
      ]);
      const before = await totals(db);

      const handed = await handOverHeadOfUnit(db, other, head);

      expect(handed).toEqual({
        ok: false,
        error: "Akun ini sudah menjadi Kepala Unit.",
      });
      expect(await totals(db)).toEqual(before);
    });
  });

  it("refuses a student account, and changes nothing", async () => {
    await inTestDatabase(async (db) => {
      const head = await addTestStaffAccount(db, "Kepala Uji", [
        "head_of_unit",
      ]);
      const program = await addTestProgram(db, PROGRAM);
      const student = await addTestStudentAccount(db, program, {
        nim: "UJISERAH01",
        name: "Mahasiswa Uji Serah",
      });
      const before = await totals(db);

      const handed = await handOverHeadOfUnit(db, student, head);

      expect(handed).toEqual({
        ok: false,
        error: "Akun mahasiswa tidak bisa menjadi Kepala Unit.",
      });
      expect(await totals(db)).toEqual(before);
    });
  });

  it("refuses a handover sent by an account that is not Kepala Unit, and changes nothing", async () => {
    await inTestDatabase(async (db) => {
      const director = await addTestStaffAccount(db, "Direktur Uji", [
        "director",
      ]);
      const next = await addTestStaffAccount(db, "Staf Uji Penerima", [
        "mentor",
      ]);
      const before = await totals(db);

      const handed = await handOverHeadOfUnit(db, next, director);

      expect(handed).toEqual({
        ok: false,
        error: "Hanya Kepala Unit yang bisa menyerahkan jabatan Kepala Unit.",
      });
      expect(await totals(db)).toEqual(before);
    });
  });

  it("refuses a handover to the one who hands over", async () => {
    await inTestDatabase(async (db) => {
      const head = await addTestStaffAccount(db, "Kepala Uji", [
        "head_of_unit",
      ]);
      const before = await totals(db);

      const handed = await handOverHeadOfUnit(db, head, head);

      expect(handed).toEqual({
        ok: false,
        error: "Anda sudah menjadi Kepala Unit. Pilih akun lain.",
      });
      expect(await totals(db)).toEqual(before);
    });
  });
});
