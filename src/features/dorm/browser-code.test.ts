import { describe, expect, it } from "vitest";
import { browserFilesIn, databaseCodeReachedFrom } from "@/ui/browser-code";

const FOLDER = "src/features/dorm";

const browserFiles = browserFilesIn(FOLDER);

describe("the screen parts of the Asrama menu that run in the browser", () => {
  it.each([
    `${FOLDER}/activity-form.tsx`,
    `${FOLDER}/clarification-form.tsx`,
    `${FOLDER}/name-companion-form.tsx`,
    `${FOLDER}/own-leave-view.tsx`,
    `${FOLDER}/return-camera.tsx`,
  ])("are found, such as %s", (path) => {
    expect(browserFiles).toContain(path);
  });

  it.each(browserFiles)("%s takes no database code along", (path) => {
    expect(databaseCodeReachedFrom(path)).toEqual([]);
  });

  it("finds database code that is taken by way of another file", () => {
    expect(
      databaseCodeReachedFrom(`${FOLDER}/activities-screen.tsx`).length,
    ).toBeGreaterThan(0);
  });
});
