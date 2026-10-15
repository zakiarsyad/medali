import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DashboardActivities, NO_ACTIVITIES } from "./dashboard-activities";

describe("DashboardActivities", () => {
  it("says there is no dorm activity in the last 7 days, instead of an empty table", () => {
    const shown = renderToStaticMarkup(
      <DashboardActivities
        activities={{ lines: [], matching: 0, page: 1 }}
        today="2026-10-16"
        mayCount={false}
      />,
    );

    expect(shown).toContain(NO_ACTIVITIES);
    expect(shown).not.toContain("<table");
    expect(shown).not.toContain("<tr");
  });
});
