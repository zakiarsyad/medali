import { describe, expect, it } from "vitest";
import { checkDeployTarget, deployPlanFor } from "./deploy-plan";

describe("deployPlanFor", () => {
  it("resets the shared PR preview database to sample data", () => {
    expect(deployPlanFor("pr-preview", "feat/x")).toBe("reset-to-sample-data");
  });

  it("only applies table changes on the preview of main, keeping its data", () => {
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

  it("applies table changes to the main preview database", () => {
    expect(
      checkDeployTarget("apply-table-changes", {
        marker: "main-preview",
        hasTables: true,
      }),
    ).toBe("go");
    expect(
      checkDeployTarget("apply-table-changes", {
        marker: null,
        hasTables: true,
      }),
    ).toBe("mark-and-go");
  });

  it("refuses to treat the PR preview database as the main one", () => {
    expect(() =>
      checkDeployTarget("apply-table-changes", {
        marker: "pr-preview",
        hasTables: true,
      }),
    ).toThrow();
  });
});
