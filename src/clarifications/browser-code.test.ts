import { describe, expect, it } from "vitest";
import { browserFilesIn, databaseCodeReachedFrom } from "@/ui/browser-code";

const FOLDER = "src/clarifications";

describe("the shared parts of a clarification that run in the browser", () => {
  it("are found: the box that shows a file", () => {
    expect(browserFilesIn(FOLDER)).toEqual([
      `${FOLDER}/clarification-file-dialog.tsx`,
    ]);
  });

  it.each([
    `${FOLDER}/clarification-file-dialog.tsx`,
    `${FOLDER}/clarification-draft.ts`,
  ])("%s takes no database code along", (path) => {
    expect(databaseCodeReachedFrom(path)).toEqual([]);
  });
});
