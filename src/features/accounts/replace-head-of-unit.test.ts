import { count, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { activeAccountIdByEmail, rolesByAccount } from "@/auth/accounts";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { accountRoles, accounts, roleChanges } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { replaceHeadOfUnit } from "./replace-head-of-unit";
import {
  addTestProgram,
  addTestStaffAccount,
  addTestStudentAccount,
  roleLogOf,
} from "./test-records";

const inTestDatabase = withTestDatabase();

const NEW_HEAD = {
  name: "Kepala Uji Baru",
  email: "kepala.uji.baru@kampus.example",
};

async function rolesOf(db: Database, accountId: string): Promise<RoleId[]> {
  const roles = await rolesByAccount(db, [accountId]);
  return roles.get(accountId) ?? [];
}

async function isRemoved(db: Database, accountId: string): Promise<boolean> {
  const [found] = await db
    .select({ deletedAt: accounts.deletedAt })
    .from(accounts)
    .where(eq(accounts.id, accountId));
  return found?.deletedAt !== null;
}

async function totals(db: Database) {
  const [inAccounts] = await db.select({ total: count() }).from(accounts);
  const [inRoles] = await db.select({ total: count() }).from(accountRoles);
  const [inLog] = await db.select({ total: count() }).from(roleChanges);
  return [inAccounts?.total, inRoles?.total, inLog?.total];
}

describe("replaceHeadOfUnit", () => {
  it("makes the account when no active account has the address, and takes Kepala Unit from every other one", async () => {
    await inTestDatabase(async (db) => {
      const stays = await addTestStaffAccount(db, "Kepala Uji Lama Satu", [
        "head_of_unit",
        "mentor",
      ]);
      const leaves = await addTestStaffAccount(db, "Kepala Uji Lama Dua", [
        "head_of_unit",
      ]);

      const replaced = await replaceHeadOfUnit(db, NEW_HEAD);

      if (!replaced.ok) throw new Error(replaced.error);
      const head = replaced.value;
      expect(await activeAccountIdByEmail(db, NEW_HEAD.email)).toBe(head);
      expect(await rolesOf(db, head)).toEqual(["head_of_unit"]);
      expect(await roleLogOf(db, head)).toMatchObject([
        { changedBy: head, action: "added", rolesAfter: ["head_of_unit"] },
      ]);
      expect(await rolesOf(db, stays)).toEqual(["mentor"]);
      expect(await isRemoved(db, stays)).toBe(false);
      expect(await roleLogOf(db, stays)).toMatchObject([
        {
          changedBy: head,
          action: "roles_changed",
          rolesBefore: ["head_of_unit", "mentor"],
          rolesAfter: ["mentor"],
        },
      ]);
      expect(await isRemoved(db, leaves)).toBe(true);
      expect(await roleLogOf(db, leaves)).toMatchObject([
        {
          changedBy: head,
          action: "removed",
          rolesBefore: ["head_of_unit"],
          rolesAfter: [],
        },
      ]);
    });
  });

  it("gives Kepala Unit to the active staff account that has the address, which keeps its other roles", async () => {
    await inTestDatabase(async (db) => {
      const [staff] = await db
        .insert(accounts)
        .values({ name: "Staf Uji Alamat", email: NEW_HEAD.email })
        .returning({ id: accounts.id });
      if (!staff) throw new Error("The account was not added.");
      await db
        .insert(accountRoles)
        .values({ accountId: staff.id, role: "counsellor" });
      await addTestStaffAccount(db, "Kepala Uji Lama", ["head_of_unit"]);

      const replaced = await replaceHeadOfUnit(db, NEW_HEAD);

      expect(replaced).toEqual({ ok: true, value: staff.id });
      expect(await rolesOf(db, staff.id)).toEqual([
        "head_of_unit",
        "counsellor",
      ]);
      expect(await roleLogOf(db, staff.id)).toMatchObject([
        {
          changedBy: staff.id,
          action: "roles_changed",
          rolesBefore: ["counsellor"],
          rolesAfter: ["head_of_unit", "counsellor"],
        },
      ]);
    });
  });

  it("refuses the address of a student account, and changes nothing", async () => {
    await inTestDatabase(async (db) => {
      const program = await addTestProgram(db, "Prodi Uji Ganti Kepala");
      const student = await addTestStudentAccount(db, program, {
        nim: "UJIGANTI01",
        name: "Mahasiswa Uji Ganti",
      });
      await db
        .update(accounts)
        .set({ email: NEW_HEAD.email })
        .where(eq(accounts.id, student));
      await addTestStaffAccount(db, "Kepala Uji Lama", ["head_of_unit"]);
      const before = await totals(db);

      const replaced = await replaceHeadOfUnit(db, NEW_HEAD);

      expect(replaced).toEqual({
        ok: false,
        error:
          "This address belongs to a student account, which cannot be Kepala Unit. Nothing was changed.",
      });
      expect(await totals(db)).toEqual(before);
    });
  });

  it("shows a fault of the database by its code, without the name or the address", async () => {
    const fault = new Error(
      `Failed query: insert into accounts params: ${NEW_HEAD.name},${NEW_HEAD.email}`,
      { cause: Object.assign(new Error("Stopped."), { code: "57P01" }) },
    );
    // Only the one call that fails is needed of a database here.
    const broken = {
      transaction: () => Promise.reject(fault),
    } as unknown as Database;

    const replaced = await replaceHeadOfUnit(broken, NEW_HEAD);

    if (replaced.ok) throw new Error("The fault was let through.");
    expect(replaced.error).toContain("code 57P01");
    expect(replaced.error).not.toContain(NEW_HEAD.name);
    expect(replaced.error).not.toContain(NEW_HEAD.email);
  });
});
