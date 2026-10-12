import { count, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { accountRoles } from "@/db/schema";
import { withOwnTestDatabase } from "@/db/test-database-at-once";
import { addFirstAccount } from "./add-first-account";

/*
 * The log of role changes cannot be emptied, so no rows are removed after
 * the check: the database is dropped at the end.
 */
const own = withOwnTestDatabase("firstaccount");

describe("the first-account command run twice at the same moment", () => {
  it("makes one Kepala Unit account, and refuses the run taken last", async () => {
    const both = await own.atOnce(
      (db) =>
        addFirstAccount(db, {
          name: "Kepala Uji Serentak Satu",
          email: "kepala.serentak.satu@kampus.example",
        }),
      (db) =>
        addFirstAccount(db, {
          name: "Kepala Uji Serentak Dua",
          email: "kepala.serentak.dua@kampus.example",
        }),
    );

    expect(both.sooner.ok).toBe(true);
    expect(both.later.ok).toBe(false);
    const [heads] = await own.db
      .select({ total: count() })
      .from(accountRoles)
      .where(eq(accountRoles.role, "head_of_unit"));
    expect(heads?.total).toBe(1);
  });
});
