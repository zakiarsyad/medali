import { describe, expect, it } from "vitest";
import { browserFilesIn, databaseCodeReachedFrom } from "@/ui/browser-code";

const FOLDER = "src/features/dorm";

/** The screen parts of Kegiatan asrama that run in the browser. */
const ACTIVITY_PARTS = [`${FOLDER}/activity-board.tsx`];

describe("the screen parts of Kegiatan asrama that run in the browser", () => {
  it("are found: the board", () => {
    const browserFiles = browserFilesIn(FOLDER);

    for (const path of ACTIVITY_PARTS) expect(browserFiles).toContain(path);
  });

  it.each(ACTIVITY_PARTS)("%s takes no database code along", (path) => {
    expect(databaseCodeReachedFrom(path)).toEqual([]);
  });

  it("finds database code that is taken by way of another file", () => {
    expect(
      databaseCodeReachedFrom(`${FOLDER}/activities-screen.tsx`).length,
    ).toBeGreaterThan(0);
  });
});
