import { describe, expect, it } from "vitest";
import { stageOf } from "@/settings";
import { checkSeedStage, checkSeedTarget } from "./seed-plan";

describe("checkSeedStage", () => {
  it("lets a local computer load the sample data", () => {
    expect(() => checkSeedStage("local")).not.toThrow();
  });

  it.each(["pr-preview", "main-preview", "campus"] as const)(
    "refuses in %s and names it",
    (stage) => {
      expect(() => checkSeedStage(stage)).toThrow(stage);
    },
  );

  it("refuses in the campus server package, though the command says it is local", () => {
    // What `pnpm db:seed` sets for itself, in the package with its mark.
    const stage = stageOf({ NODE_ENV: "development", MEDALI_CAMPUS: "1" });

    expect(() => checkSeedStage(stage)).toThrow("campus");
  });
});

describe("checkSeedTarget", () => {
  it.each([null, "pr-preview", "main-preview"] as const)(
    "goes on with a database marked %s",
    (marker) => {
      expect(() => checkSeedTarget(marker)).not.toThrow();
    },
  );

  it("refuses the database of the campus server, from anywhere", () => {
    expect(() => checkSeedTarget("campus")).toThrow(/campus.*refused/);
  });
});
