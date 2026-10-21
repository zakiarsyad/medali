import { describe, expect, it } from "vitest";
import { browserFilesIn, databaseCodeReachedFrom } from "@/ui/browser-code";

const FOLDER = "src/features/counselling";

describe("the screen parts of Konseling that run in the browser", () => {
  const browserFiles = browserFilesIn(FOLDER);

  it("are found: the panel of Konselor, its student search and the student's box at least", () => {
    expect(browserFiles).toContain(`${FOLDER}/counsellor-consent-panel.tsx`);
    expect(browserFiles).toContain(`${FOLDER}/counsellor-follow-up.tsx`);
    expect(browserFiles).toContain(`${FOLDER}/consent-student-picker.tsx`);
    expect(browserFiles).toContain(`${FOLDER}/own-consent-box.tsx`);
    expect(browserFiles).toContain(`${FOLDER}/register-form.tsx`);
    expect(browserFiles).toContain(`${FOLDER}/schedule-filter.tsx`);
    expect(browserFiles).toContain(`${FOLDER}/counsellor-schedule-item.tsx`);
    expect(browserFiles).toContain(`${FOLDER}/own-schedule-item.tsx`);
    expect(browserFiles).toContain(`${FOLDER}/screening-table.tsx`);
    expect(browserFiles).toContain(`${FOLDER}/screening-form.tsx`);
    expect(browserFiles).toContain(`${FOLDER}/shared-table.tsx`);
  });

  it.each(browserFiles)("%s takes no database code along", (path) => {
    expect(databaseCodeReachedFrom(path)).toEqual([]);
  });
});
