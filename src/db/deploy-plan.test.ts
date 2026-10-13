import { describe, expect, it } from "vitest";
import {
  checkDeployTarget,
  deployPlanFor,
  startOverReasonFor,
} from "./deploy-plan";

describe("deployPlanFor", () => {
  it("resets the shared PR preview database to sample data", () => {
    expect(deployPlanFor("pr-preview", "feat/x")).toBe("reset-to-sample-data");
  });

  it("lets a build from main deploy to the preview of main", () => {
    expect(deployPlanFor("main-preview", "main")).toBe("apply-table-changes");
  });

  it("refuses a production deploy from a branch that is not main", () => {
    expect(() => deployPlanFor("main-preview", "feat/x")).toThrow();
  });

  it("refuses a production deploy that does not say its branch", () => {
    expect(() => deployPlanFor("main-preview", undefined)).toThrow();
  });

  it.each(["local", "campus"] as const)("refuses to run in %s", (stage) => {
    expect(() => deployPlanFor(stage, undefined)).toThrow();
  });
});

describe("checkDeployTarget", () => {
  it("resets a database marked as the PR preview one", () => {
    expect(
      checkDeployTarget("reset-to-sample-data", {
        marker: "pr-preview",
        hasTables: true,
      }),
    ).toBe("go");
  });

  it("marks and resets an unmarked database that holds no tables", () => {
    expect(
      checkDeployTarget("reset-to-sample-data", {
        marker: null,
        hasTables: false,
      }),
    ).toBe("mark-and-go");
  });

  it.each([
    [{ marker: null, hasTables: true }],
    [{ marker: "main-preview" as const, hasTables: true }],
    [{ marker: "main-preview" as const, hasTables: false }],
  ])("refuses to reset any other database: %o", (target) => {
    expect(() => checkDeployTarget("reset-to-sample-data", target)).toThrow();
  });

  it("deploys main to the main preview database", () => {
    expect(
      checkDeployTarget("apply-table-changes", {
        marker: "main-preview",
        hasTables: true,
      }),
    ).toBe("go");
    expect(
      checkDeployTarget("apply-table-changes", {
        marker: null,
        hasTables: false,
      }),
    ).toBe("mark-and-go");
  });

  it("refuses to take an unmarked database that holds tables for the main one", () => {
    expect(() =>
      checkDeployTarget("apply-table-changes", {
        marker: null,
        hasTables: true,
      }),
    ).toThrow("refused to empty it");
  });

  it("refuses to treat the PR preview database as the main one", () => {
    expect(() =>
      checkDeployTarget("apply-table-changes", {
        marker: "pr-preview",
        hasTables: true,
      }),
    ).toThrow();
  });

  it.each(["reset-to-sample-data", "apply-table-changes"] as const)(
    "refuses to %s in the database of the campus server",
    (plan) => {
      const target = { marker: "campus" as const, hasTables: true };

      expect(() => checkDeployTarget(plan, target)).toThrow(/marked campus/);
    },
  );
});

describe("startOverReasonFor", () => {
  const UP_TO_DATE = {
    tableChangesApplied: 5,
    tableChangesInRepo: 5,
    holdsAnAccount: true,
    hasStartMark: true,
  };

  it("keeps the data when no table change is new", () => {
    expect(startOverReasonFor(UP_TO_DATE)).toBeNull();
  });

  it.each([4, 0])(
    "starts over when the database has %i of 5 table changes",
    (tableChangesApplied) => {
      const state = { ...UP_TO_DATE, tableChangesApplied };

      expect(startOverReasonFor(state)).toBe("new-table-change");
    },
  );

  it("keeps the data of a database that is ahead of the build", () => {
    const state = { ...UP_TO_DATE, tableChangesApplied: 6 };

    expect(startOverReasonFor(state)).toBeNull();
  });

  it("starts over a database that holds no account", () => {
    const state = { ...UP_TO_DATE, holdsAnAccount: false };

    expect(startOverReasonFor(state)).toBe("no-account");
  });

  it("starts over a database with no mark of a start, also with no new table change", () => {
    const state = { ...UP_TO_DATE, hasStartMark: false };

    expect(startOverReasonFor(state)).toBe("no-start-mark");
  });
});
