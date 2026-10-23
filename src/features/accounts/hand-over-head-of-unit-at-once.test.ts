import { and, count, eq, isNull } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { accountRoles, accounts } from "@/db/schema";
import { withOwnTestDatabase } from "@/db/test-database-at-once";
import { handOverHeadOfUnit } from "./hand-over-head-of-unit";
import { addTestStaffAccount } from "./test-records";

/*
 * The log of role changes cannot be emptied, so no rows are removed after
 * the check: the database is dropped at the end.
 */
const own = withOwnTestDatabase("handover");

async function activeHeads(): Promise<number | undefined> {
  const [heads] = await own.db
    .select({ total: count() })
    .from(accountRoles)
    .innerJoin(accounts, eq(accounts.id, accountRoles.accountId))
    .where(
      and(eq(accountRoles.role, "head_of_unit"), isNull(accounts.deletedAt)),
    );
  return heads?.total;
}

describe("two handovers sent by one Kepala Unit at the same moment", () => {
  it("hands over once, refuses the one taken last, and leaves one Kepala Unit", async () => {
    const head = await addTestStaffAccount(own.db, "Kepala Uji Serentak", [
      "head_of_unit",
      "mentor",
    ]);
    const first = await addTestStaffAccount(own.db, "Staf Uji Serentak Satu", [
      "counsellor",
    ]);
    const second = await addTestStaffAccount(own.db, "Staf Uji Serentak Dua", [
      "assessor",
    ]);

    const both = await own.atOnce(
      (db) => handOverHeadOfUnit(db, first, head),
      (db) => handOverHeadOfUnit(db, second, head),
    );

    expect(both.sooner).toEqual({ ok: true, value: null });
    expect(both.later).toEqual({
      ok: false,
      error: "Hanya Kepala Unit yang bisa menyerahkan jabatan Kepala Unit.",
    });
    expect(await activeHeads()).toBe(1);
  });
});
