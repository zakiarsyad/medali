import { describe, expect, it } from "vitest";
import {
  forgetStarts,
  hasStartMark,
  noteFilesEmptied,
  noteStart,
  startWaitsForFiles,
} from "./deploy-start";
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

  it("says a start waits for its files until they are noted as emptied", async () => {
    expect(await startWaitsForFiles(own.db)).toBe(true);

    await noteFilesEmptied(own.db);

    expect(await startWaitsForFiles(own.db)).toBe(false);

    await noteStart(own.db);

    expect(await startWaitsForFiles(own.db)).toBe(true);
  });

  it("is missing again once the starts are forgotten", async () => {
    await forgetStarts(own.db);

    expect(await hasStartMark(own.db)).toBe(false);
    expect(await startWaitsForFiles(own.db)).toBe(false);
  });
});

describe("a database with no mark of a start", () => {
  const own = withEmptyTestDatabase("deploystartnone");

  it("has no start that waits for its files", async () => {
    expect(await startWaitsForFiles(own.db)).toBe(false);
  });

  it("has no start to forget, and forgetting fails nothing", async () => {
    await forgetStarts(own.db);

    expect(await hasStartMark(own.db)).toBe(false);
  });
});
