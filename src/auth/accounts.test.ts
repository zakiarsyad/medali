import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import { accountRoles, accounts } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { findActiveAccount } from "./accounts";
import type { RoleId } from "./role-ids";

const inTestDatabase = withTestDatabase();

async function addAccount(
  db: Database,
  roles: RoleId[],
  deletedAt: Date | null = null,
): Promise<string> {
  const [account] = await db
    .insert(accounts)
    .values({ name: "Akun Uji", deletedAt })
    .returning();
  if (!account) throw new Error("The account was not added.");
  await db
    .insert(accountRoles)
    .values(roles.map((role) => ({ accountId: account.id, role })));
  return account.id;
}

describe("findActiveAccount", () => {
  it("finds an account with all its roles in role order", async () => {
    await inTestDatabase(async (db) => {
      const id = await addAccount(db, ["assessor", "mentor"]);
      const account = await findActiveAccount(db, id);
      expect(account?.roles).toEqual(["mentor", "assessor"]);
    });
  });

  it("does not find a removed account", async () => {
    await inTestDatabase(async (db) => {
      const id = await addAccount(db, ["mentor"], new Date());
      expect(await findActiveAccount(db, id)).toBeNull();
    });
  });

  it("does not find an id that is not an account id", async () => {
    await inTestDatabase(async (db) => {
      expect(await findActiveAccount(db, "not-an-id")).toBeNull();
    });
  });
});
