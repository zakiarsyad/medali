import { describe, expect, it } from "vitest";
import { hasStartMark, noteStart } from "./deploy-start";
import { markDatabase } from "./deploy-target";
import { rebuildTables } from "./rebuild";
import { withEmptyTestDatabase } from "./test-database-alone";

describe("the mark of a start with sample data", () => {
  const own = withEmptyTestDatabase("deploystart");

  it("is missing in a database that was only marked for a preview", async () => {
    expect(await hasStartMark(own.db)).toBe(false);

    await markDatabase(own.db, "main-preview");

    expect(await hasStartMark(own.db)).toBe(false);
  });

  it("is there once a start is noted, and stays when the tables are made again", async () => {
    await noteStart(own.db);

    expect(await hasStartMark(own.db)).toBe(true);

    await rebuildTables(own.db);

    expect(await hasStartMark(own.db)).toBe(true);
  });
});
