import { count, eq, sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { describe, expect, it } from "vitest";
import { deployDatabase } from "./deploy-database";
import { hasStartMark } from "./deploy-start";
import { markDatabase, readDeployTarget } from "./deploy-target";
import { accounts } from "./schema";
import { withEmptyTestDatabase } from "./test-database-alone";

const ADDED_BY_HAND = "Pegawai Uji Deploy Main";

function deployMain(db: PostgresJsDatabase): Promise<string> {
  return deployDatabase(db, "main-preview", "main");
}

async function addByHand(db: PostgresJsDatabase): Promise<void> {
  await db.insert(accounts).values({ name: ADDED_BY_HAND });
}

async function countAddedByHand(db: PostgresJsDatabase): Promise<number> {
  const [counted] = await db
    .select({ total: count() })
    .from(accounts)
    .where(eq(accounts.name, ADDED_BY_HAND));
  return counted?.total ?? 0;
}

async function countAccounts(db: PostgresJsDatabase): Promise<number> {
  const [counted] = await db.select({ total: count() }).from(accounts);
  return counted?.total ?? 0;
}

/** Makes the database look one table change behind the build. */
async function forgetLastTableChange(db: PostgresJsDatabase): Promise<void> {
  await db.execute(sql`
    delete from drizzle.__drizzle_migrations
    where id = (select max(id) from drizzle.__drizzle_migrations)`);
}

// Each start loads the whole sample set, which takes seconds.
describe("the database step of a deploy of main", { timeout: 120_000 }, () => {
  const own = withEmptyTestDatabase("deploymain");

  it("marks an empty database and fills it with sample data", async () => {
    const done = await deployMain(own.db);

    expect(done).toContain("started over");
    expect((await readDeployTarget(own.db)).marker).toBe("main-preview");
    expect(await countAccounts(own.db)).toBeGreaterThan(0);
  });

  it("keeps the data when no table change is new", async () => {
    await addByHand(own.db);

    const done = await deployMain(own.db);

    expect(done).toContain("data kept");
    expect(await countAddedByHand(own.db)).toBe(1);
  });

  it("starts over with sample data when a table change is new", async () => {
    await forgetLastTableChange(own.db);

    const done = await deployMain(own.db);

    expect(done).toContain("started over");
    expect(done).not.toContain("data kept");
    expect(await countAddedByHand(own.db)).toBe(0);
    expect(await countAccounts(own.db)).toBeGreaterThan(0);
  });

  it("starts a database from before the mark of a start over, once", async () => {
    await addByHand(own.db);
    await own.db.execute(sql`drop table medali_deploy.sample_data_start`);

    const first = await deployMain(own.db);

    expect(first).toContain("started over");
    expect(await countAddedByHand(own.db)).toBe(0);
    expect(await hasStartMark(own.db)).toBe(true);
    await addByHand(own.db);

    const second = await deployMain(own.db);

    expect(second).toContain("data kept");
    expect(await countAddedByHand(own.db)).toBe(1);
  });

  it("refuses a build from another branch, and keeps the data", async () => {
    await forgetLastTableChange(own.db);

    const step = deployDatabase(own.db, "main-preview", "feat/uji");

    await expect(step).rejects.toThrow("refused");
    expect(await countAddedByHand(own.db)).toBe(1);
  });
});

describe("the database step of a PR deploy", { timeout: 120_000 }, () => {
  const own = withEmptyTestDatabase("deploypr");

  it("fills the PR preview database, and leaves no mark of a start", async () => {
    const done = await deployDatabase(own.db, "pr-preview", "feat/uji");

    expect(done).toBe("PR preview database reset to sample data.");
    expect((await readDeployTarget(own.db)).marker).toBe("pr-preview");
    expect(await countAccounts(own.db)).toBeGreaterThan(0);
    expect(await hasStartMark(own.db)).toBe(false);
  });
});

describe("the database step of a deploy of main given another database", () => {
  const own = withEmptyTestDatabase("deploymainother");

  it.each(["campus", "pr-preview"] as const)(
    "refuses one marked %s and makes no table",
    async (kind) => {
      await own.db.execute(sql`drop schema if exists medali_deploy cascade`);
      await markDatabase(own.db, kind);

      await expect(deployMain(own.db)).rejects.toThrow(`marked ${kind}`);
      const target = await readDeployTarget(own.db);
      expect(target).toEqual({ marker: kind, hasTables: false });
    },
  );
});
