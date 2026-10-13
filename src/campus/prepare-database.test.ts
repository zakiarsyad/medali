import { readdirSync } from "node:fs";
import { count } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { markDatabase, readDeployTarget } from "@/db/deploy-target";
import { MIGRATIONS_FOLDER } from "@/db/migrate";
import { Refusal } from "@/db/refusal";
import { accounts } from "@/db/schema";
import { withEmptyTestDatabase } from "@/db/test-database-alone";
import { prepareCampusDatabase } from "./prepare-database";

const TABLE_CHANGES = readdirSync(MIGRATIONS_FOLDER).filter((name) =>
  name.endsWith(".sql"),
).length;

describe("the database step of the campus server package", () => {
  const own = withEmptyTestDatabase("campusstep");

  it("marks an empty database and applies every table change, once", async () => {
    expect(TABLE_CHANGES).toBeGreaterThan(0);
    expect((await readDeployTarget(own.db)).marker).toBeNull();

    const first = await prepareCampusDatabase(own.db);

    expect(first).toBe(TABLE_CHANGES);
    expect((await readDeployTarget(own.db)).marker).toBe("campus");
    await own.db.insert(accounts).values({ name: "Kepala Uji Langkah Basis" });

    const second = await prepareCampusDatabase(own.db);

    expect(second).toBe(0);
    expect((await readDeployTarget(own.db)).marker).toBe("campus");
    const [kept] = await own.db.select({ total: count() }).from(accounts);
    expect(kept?.total).toBe(1);
  });
});

describe("the database step given a preview's database", () => {
  const own = withEmptyTestDatabase("campusstepother");

  it("refuses it and makes no table", async () => {
    await markDatabase(own.db, "pr-preview");

    const step = prepareCampusDatabase(own.db);

    await expect(step).rejects.toBeInstanceOf(Refusal);
    const target = await readDeployTarget(own.db);
    expect(target).toEqual({ marker: "pr-preview", hasTables: false });
  });
});
