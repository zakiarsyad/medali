import { count, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { findActiveAccount } from "@/auth/accounts";
import type { Database } from "@/db/connect";
import { accountRoles, accounts, roleChanges } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { addFirstAccount } from "./add-first-account";
import { addTestStaffAccount } from "./test-records";

const inTestDatabase = withTestDatabase();

const FIRST = {
  name: "Kepala Uji Pertama",
  email: "kepala.uji.pertama@kampus.example",
};

async function totals(db: Database) {
  const [inAccounts] = await db.select({ total: count() }).from(accounts);
  const [inRoles] = await db.select({ total: count() }).from(accountRoles);
  const [inLog] = await db.select({ total: count() }).from(roleChanges);
  return [inAccounts?.total, inRoles?.total, inLog?.total];
}

describe("addFirstAccount", () => {
  it("makes one Kepala Unit account and logs it as added by itself", async () => {
    await inTestDatabase(async (db) => {
      const before = await totals(db);
      const added = await addFirstAccount(db, FIRST);
      if (!added.ok) throw new Error(added.error);

      const account = await findActiveAccount(db, added.value);
      expect(account).toMatchObject({
        name: FIRST.name,
        roles: ["head_of_unit"],
      });
      const [saved] = await db
        .select({ email: accounts.email })
        .from(accounts)
        .where(eq(accounts.id, added.value));
      expect(saved?.email).toBe(FIRST.email);
      const log = await db
        .select()
        .from(roleChanges)
        .where(eq(roleChanges.accountId, added.value));
      expect(log).toHaveLength(1);
      expect(log[0]).toMatchObject({
        changedBy: added.value,
        action: "added",
        rolesBefore: [],
        rolesAfter: ["head_of_unit"],
      });
      expect(await totals(db)).toEqual(before.map((total) => (total ?? 0) + 1));
    });
  });

  it("refuses a second time, says why, and changes nothing", async () => {
    await inTestDatabase(async (db) => {
      await addFirstAccount(db, FIRST);
      const before = await totals(db);

      const again = await addFirstAccount(db, {
        name: "Kepala Uji Kedua",
        email: "kepala.uji.kedua@kampus.example",
      });

      expect(again).toEqual({
        ok: false,
        error:
          "A Kepala Unit account already exists. This command only makes the first one; that account adds everyone else in the app.",
      });
      expect(await totals(db)).toEqual(before);
    });
  });

  it("refuses while any other Kepala Unit account exists", async () => {
    await inTestDatabase(async (db) => {
      await addTestStaffAccount(db, "Kepala Uji Lama", ["head_of_unit"]);
      const before = await totals(db);

      const added = await addFirstAccount(db, FIRST);

      expect(added.ok).toBe(false);
      expect(await totals(db)).toEqual(before);
    });
  });

  it("does not count a Kepala Unit account that was removed", async () => {
    await inTestDatabase(async (db) => {
      const old = await addTestStaffAccount(db, "Kepala Uji Dihapus", [
        "head_of_unit",
      ]);
      await db
        .update(accounts)
        .set({ deletedAt: new Date(), deletedBy: old })
        .where(eq(accounts.id, old));

      const added = await addFirstAccount(db, FIRST);

      expect(added.ok).toBe(true);
    });
  });

  it("does not count an account that holds other roles only", async () => {
    await inTestDatabase(async (db) => {
      await addTestStaffAccount(db, "Direktur Uji", ["director", "mentor"]);

      const added = await addFirstAccount(db, FIRST);

      expect(added.ok).toBe(true);
    });
  });

  it("refuses an address another account uses, and changes nothing", async () => {
    await inTestDatabase(async (db) => {
      await db
        .insert(accounts)
        .values({ name: "Staf Uji Alamat Sama", email: FIRST.email });
      const before = await totals(db);

      const added = await addFirstAccount(db, FIRST);

      expect(added).toEqual({
        ok: false,
        error: "Another account already uses this address.",
      });
      expect(await totals(db)).toEqual(before);
    });
  });
});
