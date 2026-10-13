import { describe, expect, it } from "vitest";
import { browserFilesIn, databaseCodeReachedFrom } from "@/ui/browser-code";

const FOLDER = "src/features/cohort-assignments";

const browserFiles = browserFilesIn(FOLDER);

describe("the screen parts of Penetapan angkatan baru that run in the browser", () => {
  it("are found: the form that forms the groups, the choices of a mentor and of a group, the buttons that fill the mentors and cancel, the form that fixes, and the one save at a time", () => {
    expect(browserFiles.sort()).toEqual([
      `${FOLDER}/cancel-button.tsx`,
      `${FOLDER}/fill-mentors-button.tsx`,
      `${FOLDER}/fixing-form.tsx`,
      `${FOLDER}/forming-form.tsx`,
      `${FOLDER}/mentor-select.tsx`,
      `${FOLDER}/move-select.tsx`,
      `${FOLDER}/one-save.tsx`,
    ]);
  });

  it.each(browserFiles)("%s takes no database code along", (path) => {
    expect(databaseCodeReachedFrom(path)).toEqual([]);
  });

  it("finds the database library where a file takes it", () => {
    const reads = `${FOLDER}/cohort-list.ts`;

    expect(databaseCodeReachedFrom(reads)).toContain(
      `${reads} takes drizzle-orm`,
    );
  });

  it("finds the table definitions that are taken by way of another file", () => {
    expect(databaseCodeReachedFrom(`${FOLDER}/fix-assignment.ts`)).toContain(
      "src/db/schema.ts takes drizzle-orm",
    );
  });
});
