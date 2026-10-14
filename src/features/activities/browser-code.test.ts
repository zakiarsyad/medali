import { describe, expect, it } from "vitest";
import { browserFilesIn, databaseCodeReachedFrom } from "@/ui/browser-code";

const FOLDER = "src/features/activities";

const browserFiles = browserFilesIn(FOLDER);

describe("the screen parts of Kegiatan karakter that run in the browser", () => {
  it("are found: the board, the form and the removal button, the student's cards with their upload, their history with the form of a clarification, the photo cards with their decision, the record made by hand, and the clarification cards with their decision and their filters", () => {
    expect(browserFiles.sort()).toEqual([
      `${FOLDER}/card-decision.tsx`,
      `${FOLDER}/clarification-cards.tsx`,
      `${FOLDER}/clarification-decide.tsx`,
      `${FOLDER}/clarification-filters.tsx`,
      `${FOLDER}/clarification-form.tsx`,
      `${FOLDER}/current-activities.tsx`,
      `${FOLDER}/history-table.tsx`,
      `${FOLDER}/manual-record-form.tsx`,
      `${FOLDER}/photo-cards.tsx`,
      `${FOLDER}/photo-sender.tsx`,
      `${FOLDER}/remove-schedule-button.tsx`,
      `${FOLDER}/schedule-board.tsx`,
      `${FOLDER}/schedule-form.tsx`,
    ]);
  });

  it.each(browserFiles)("%s takes no database code along", (path) => {
    expect(databaseCodeReachedFrom(path)).toEqual([]);
  });

  it("finds database code that is taken by way of another file", () => {
    const reads = `${FOLDER}/activity-choices.ts`;

    expect(databaseCodeReachedFrom(reads)).toContain(
      `${reads} takes drizzle-orm`,
    );
    expect(
      databaseCodeReachedFrom(`${FOLDER}/schedules-screen.tsx`).length,
    ).toBeGreaterThan(0);
  });
});
