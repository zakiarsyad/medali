import { describe, expect, it } from "vitest";
import { browserFilesIn, databaseCodeReachedFrom } from "@/ui/browser-code";

const FOLDER = "src/features/counselling";

describe("the screen parts of Konseling that run in the browser", () => {
  const browserFiles = browserFilesIn(FOLDER);

  it("are found: the panel of Konselor and its student search at least", () => {
    expect(browserFiles).toContain(`${FOLDER}/counsellor-consent-panel.tsx`);
    expect(browserFiles).toContain(`${FOLDER}/consent-student-picker.tsx`);
  });

  it.each(browserFiles)("%s takes no database code along", (path) => {
    expect(databaseCodeReachedFrom(path)).toEqual([]);
  });
});
