import { count, sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { memoryStore } from "@/files/memory-store";
import { markDatabase, readDeployTarget } from "./deploy-target";
import { applyTableChanges } from "./migrate";
import { Refusal } from "./refusal";
import { accounts } from "./schema";
import { loadSampleData, loadSamplePhotos } from "./seed-steps";
import { withEmptyTestDatabase } from "./test-database-alone";

const own = withEmptyTestDatabase("seedsteps");

async function totals() {
  const [inAccounts] = await own.db.select({ total: count() }).from(accounts);
  const tables = await own.db.execute<{ total: number }>(sql`
    select count(*)::int as total from information_schema.tables
    where table_schema = 'public'`);
  // The id of a table changes when the table is made again.
  const made = await own.db.execute<{ id: string }>(
    sql`select 'public.accounts'::regclass::oid::text as id`,
  );
  return {
    accounts: inAccounts?.total,
    tables: tables[0]?.total,
    accountsTable: made[0]?.id,
  };
}

describe("the sample data command against the database of the campus server", () => {
  it("refuses before any table is made again, and changes nothing", async () => {
    await applyTableChanges(own.db);
    await own.db.insert(accounts).values({ name: "Kepala Uji Tanda Kampus" });
    await markDatabase(own.db, "campus");
    const before = await totals();

    // As a local computer would run it: only the mark can stop it.
    const loading = loadSampleData(own.db, "local");

    await expect(loading).rejects.toBeInstanceOf(Refusal);
    await expect(loading).rejects.toThrow(/marked campus.*refused/);
    expect((await readDeployTarget(own.db)).marker).toBe("campus");
    expect(before.accounts).toBe(1);
    expect(await totals()).toEqual(before);
  });

  it("refuses the sample photos too, and keeps no file", async () => {
    const store = memoryStore();

    const loading = loadSamplePhotos(own.db, store, "local");

    await expect(loading).rejects.toThrow(/marked campus.*refused/);
    expect(store.files.size).toBe(0);
  });
});

describe("the sample photos command", () => {
  it.each(["pr-preview", "main-preview", "campus"] as const)(
    "is refused in %s before the database is asked, and keeps no file",
    async (stage) => {
      const store = memoryStore();

      const loading = loadSamplePhotos(own.db, store, stage);

      await expect(loading).rejects.toThrow(stage);
      expect(store.files.size).toBe(0);
    },
  );
});
