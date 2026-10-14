import { describe, expect, it } from "vitest";
import { browserFilesIn, databaseCodeReachedFrom } from "@/ui/browser-code";

const FOLDER = "src/features/siku";

describe("the screen parts of Penilaian SIKU that run in the browser", () => {
  const browserFiles = browserFilesIn(FOLDER);

  it("are found: the form and the filters at least", () => {
    expect(browserFiles).toContain(`${FOLDER}/siku-form.tsx`);
    expect(browserFiles).toContain(`${FOLDER}/siku-filters.tsx`);
  });

  it.each(browserFiles)("%s takes no database code along", (path) => {
    expect(databaseCodeReachedFrom(path)).toEqual([]);
  });
});
