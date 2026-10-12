import { describe, expect, it } from "vitest";
import { copyDatabasesOf } from "./copy-databases";

const LOCAL = "postgres://medali@localhost:5432";
const DEFAULT_APP = `${LOCAL}/medali`;
const DEFAULT_TEST = `${LOCAL}/medali_test`;
const OWN_APP = `${LOCAL}/medali_126`;
const OWN_TEST = `${LOCAL}/medali_126_test`;
const REMOTE = "postgres://u@db.example.com:5432";

describe("copyDatabasesOf", () => {
  it("is the default two when the copy names only the app's default", () => {
    expect(copyDatabasesOf({ DATABASE_URL: DEFAULT_APP })).toEqual({
      app: DEFAULT_APP,
      test: DEFAULT_TEST,
    });
  });

  it("is the copy's own two when its settings name them", () => {
    const env = { DATABASE_URL: OWN_APP, TEST_DATABASE_URL: OWN_TEST };
    expect(copyDatabasesOf(env)).toEqual({ app: OWN_APP, test: OWN_TEST });
  });

  it("refuses when the app's address is missing", () => {
    expect(() => copyDatabasesOf({})).toThrow(/DATABASE_URL is missing/);
  });

  it("refuses the same database for the app and the checks", () => {
    const env = { DATABASE_URL: OWN_APP, TEST_DATABASE_URL: OWN_APP };
    expect(() => copyDatabasesOf(env)).toThrow(/app's own database/);
  });

  it.each([
    [{ DATABASE_URL: `${REMOTE}/medali_126`, TEST_DATABASE_URL: OWN_TEST }],
    [{ DATABASE_URL: OWN_APP, TEST_DATABASE_URL: `${REMOTE}/medali_126_test` }],
    [{ DATABASE_URL: `${REMOTE}/medali` }],
    [{ DATABASE_URL: "medali_126" }],
  ])("refuses an address that is not on this computer: %o", (env) => {
    expect(() => copyDatabasesOf(env)).toThrow(
      /not a database on this computer/,
    );
  });

  it.each([
    ["Medali"],
    ["medali-126"],
    ["medali 126"],
    ['medali"; drop database medali; --'],
    ["126_medali"],
  ])("refuses the database name %j", (name) => {
    const env = { DATABASE_URL: `${LOCAL}/${encodeURIComponent(name)}` };
    expect(() => copyDatabasesOf(env)).toThrow(/Use only small letters/);
  });

  it.each([[`${LOCAL}`], [`${LOCAL}/medali_126?database=medali`]])(
    "refuses %s, whose name is not the database it reaches",
    (url) => {
      const env = { DATABASE_URL: url, TEST_DATABASE_URL: OWN_TEST };
      expect(() => copyDatabasesOf(env)).toThrow(/must end with the name/);
    },
  );

  it.each([["postgres"], ["template0"], ["template1"]])(
    "refuses %s, which the database server keeps for itself",
    (name) => {
      const env = {
        DATABASE_URL: OWN_APP,
        TEST_DATABASE_URL: `${LOCAL}/${name}`,
      };
      expect(() => copyDatabasesOf(env)).toThrow(/keeps for itself/);
    },
  );
});
