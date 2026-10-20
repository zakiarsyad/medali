import { describe, expect, it } from "vitest";
import { databaseCodeReachedFrom } from "@/ui/browser-code";

const FOLDER = "src/features/students";

describe("the survey on Profil saya, which runs in the browser", () => {
  it.each([`${FOLDER}/own-survey-card.tsx`, `${FOLDER}/own-survey-form.tsx`])(
    "%s takes no database code along",
    (path) => {
      expect(databaseCodeReachedFrom(path)).toEqual([]);
    },
  );
});
