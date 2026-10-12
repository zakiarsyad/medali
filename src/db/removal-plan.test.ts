import { describe, expect, it } from "vitest";
import { copyDatabasesOf } from "./copy-databases";
import { removalPlanOf } from "./removal-plan";

const LOCAL = "postgres://medali@localhost:5432";
const DEFAULT_APP = `${LOCAL}/medali`;
const DEFAULT_TEST = `${LOCAL}/medali_test`;
const OWN_APP = `${LOCAL}/medali_126`;
const OWN_TEST = `${LOCAL}/medali_126_test`;

describe("removalPlanOf", () => {
  it("removes only the copy's own two", () => {
    expect(removalPlanOf({ app: OWN_APP, test: OWN_TEST })).toEqual({
      remove: [OWN_APP, OWN_TEST],
      keep: [],
    });
  });

  it("never removes the default two", () => {
    expect(removalPlanOf({ app: DEFAULT_APP, test: DEFAULT_TEST })).toEqual({
      remove: [],
      keep: ["medali", "medali_test"],
    });
  });

  it("keeps the default two when the copy's settings name nothing more", () => {
    const copy = copyDatabasesOf({ DATABASE_URL: DEFAULT_APP });
    expect(removalPlanOf(copy).remove).toEqual([]);
  });

  it("keeps a default database beside one of the copy's own", () => {
    expect(removalPlanOf({ app: OWN_APP, test: DEFAULT_TEST })).toEqual({
      remove: [OWN_APP],
      keep: ["medali_test"],
    });
  });

  it("keeps a default database on another local address and port", () => {
    const app = "postgres://medali@127.0.0.1:5433/medali";
    expect(removalPlanOf({ app, test: OWN_TEST })).toEqual({
      remove: [OWN_TEST],
      keep: ["medali"],
    });
  });

  it("is never reached for a database outside this computer", () => {
    const env = {
      DATABASE_URL: "postgres://u@db.example.com:5432/medali_126",
      TEST_DATABASE_URL: "postgres://u@db.example.com:5432/medali_126_test",
    };
    expect(() => removalPlanOf(copyDatabasesOf(env))).toThrow(
      /not a database on this computer/,
    );
  });
});
