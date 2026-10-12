import { describe, expect, it } from "vitest";
import {
  DEFAULT_TEST_DATABASE_URL,
  testDatabaseUrlOf,
} from "./test-database-url";

const APP = "postgres://medali@localhost:5432/medali";
const OWN_APP = "postgres://medali@localhost:5432/medali_126";
const OWN_TEST = "postgres://medali@localhost:5432/medali_126_test";

describe("testDatabaseUrlOf", () => {
  it("is today's address when nothing is set", () => {
    expect(DEFAULT_TEST_DATABASE_URL).toBe(
      "postgres://medali@localhost:5432/medali_test",
    );
    expect(testDatabaseUrlOf({})).toBe(DEFAULT_TEST_DATABASE_URL);
  });

  it.each([
    [{ DATABASE_URL: APP }],
    [{ DATABASE_URL: APP, TEST_DATABASE_URL: "" }],
    [{ DATABASE_URL: OWN_APP }],
    [{ DATABASE_URL: "not a url" }],
  ])("is today's address when only the app's is set: %o", (env) => {
    expect(testDatabaseUrlOf(env)).toBe(DEFAULT_TEST_DATABASE_URL);
  });

  it("is the copy's own address when it sets one, never the default", () => {
    const env = { DATABASE_URL: OWN_APP, TEST_DATABASE_URL: OWN_TEST };
    expect(testDatabaseUrlOf(env)).toBe(OWN_TEST);
  });

  it.each([
    [APP, APP, "the same address"],
    [OWN_APP, OWN_APP, "the same own address"],
    [APP, "postgres://medali@127.0.0.1:5432/medali", "another local name"],
    [APP, "postgres://medali@[::1]:5432/medali", "a third local name"],
    [APP, "postgres://medali@LOCALHOST.:5432/medali", "capital letters"],
    [APP, "postgres://medali@localhost/medali", "the port left out"],
    [APP, "postgres://medali@localhost:5433/medali", "another port"],
    [APP, "postgres://other@localhost:5432/medali?sslmode=disable", "extras"],
    [
      "postgres://medali@localhost:5432/medali_test",
      undefined,
      "the default, named as the app's database",
    ],
  ])("refuses the app's %s with the checks' %s: %s", (app, test, _kind) => {
    const env = { DATABASE_URL: app, TEST_DATABASE_URL: test };
    expect(() => testDatabaseUrlOf(env)).toThrow(/app's own database/);
  });

  it.each([
    ["postgres://medali@localhost:5432", "no name"],
    ["postgres://medali@localhost:5432/", "no name"],
    [
      "postgres://medali@localhost:5432/medali_test?database=medali",
      "a part that replaces the name",
    ],
  ])("refuses %s as the checks' address: %s", (url, _kind) => {
    const env = { DATABASE_URL: APP, TEST_DATABASE_URL: url };
    expect(() => testDatabaseUrlOf(env)).toThrow(
      /TEST_DATABASE_URL must end with the name/,
    );
  });

  it.each([
    ["postgres://medali@localhost:5432", "no name"],
    [
      "postgres://medali@localhost:5432/medali_126?database=medali_126_test",
      "a part that replaces the name",
    ],
  ])("refuses %s as the app's address: %s", (url, _kind) => {
    const env = { DATABASE_URL: url, TEST_DATABASE_URL: OWN_TEST };
    expect(() => testDatabaseUrlOf(env)).toThrow(
      /DATABASE_URL must end with the name/,
    );
  });

  it("refuses a setting that is not an address", () => {
    expect(() => testDatabaseUrlOf({ TEST_DATABASE_URL: "medali_x" })).toThrow(
      /not an address/,
    );
  });
});
