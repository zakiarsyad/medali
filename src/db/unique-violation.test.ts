import { describe, expect, it } from "vitest";
import type { Database } from "./connect";
import { accounts } from "./schema";
import { withTestDatabase } from "./test-database";
import { brokeUniqueRule } from "./unique-violation";

const inTestDatabase = withTestDatabase();

/** The fault of adding a second active account with one address. */
async function faultOfSecondAccount(db: Database): Promise<unknown> {
  const account = { name: "Akun Uji", email: "budi@kampus.example" };
  await db.insert(accounts).values(account);
  try {
    // Its own transaction, so the refused write does not end the check's.
    await db.transaction((tx) => tx.insert(accounts).values(account));
  } catch (error) {
    return error;
  }
  throw new Error("The second account was not refused.");
}

describe("brokeUniqueRule", () => {
  it("knows a write refused by the rule it is asked about", async () => {
    await inTestDatabase(async (db) => {
      const fault = await faultOfSecondAccount(db);

      expect(brokeUniqueRule(fault, "accounts_email_in_use")).toBe(true);
    });
  });

  it("does not take it for a write refused by another rule", async () => {
    await inTestDatabase(async (db) => {
      const fault = await faultOfSecondAccount(db);

      expect(brokeUniqueRule(fault, "students_nim_unique")).toBe(false);
    });
  });

  it.each([
    ["another fault", new Error("accounts_email_in_use")],
    ["a text", "23505"],
    ["nothing", undefined],
  ])("does not take %s for a refused write", (_kind, fault) => {
    expect(brokeUniqueRule(fault, "accounts_email_in_use")).toBe(false);
  });
});
