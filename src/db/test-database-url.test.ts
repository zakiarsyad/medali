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
    [APP, "postgres://medali@localhost/medali", "the port left out"],
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

  it("allows the same name on another server", () => {
    const env = {
      DATABASE_URL: "postgres://u@db.example.com:5432/medali_test",
      TEST_DATABASE_URL: DEFAULT_TEST_DATABASE_URL,
    };
    expect(testDatabaseUrlOf(env)).toBe(DEFAULT_TEST_DATABASE_URL);
  });

  it("refuses a setting that is not an address", () => {
    expect(() => testDatabaseUrlOf({ TEST_DATABASE_URL: "medali_x" })).toThrow(
      /not an address/,
    );
  });
});
