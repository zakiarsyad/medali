import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { GroupMentorPanel } from "./group-mentor-panel";

function panelWith(recentNotes: number | null): string {
  return renderToStaticMarkup(
    <GroupMentorPanel mentors={[]} recentNotes={recentNotes} />,
  );
}

describe("GroupMentorPanel", () => {
  it("shows Catatan pengasuhan 90 hari with its count to an account that may read notes", () => {
    expect(panelWith(7)).toMatch(/Catatan pengasuhan 90 hari:.*<b>7<\/b>/);
    expect(panelWith(0)).toMatch(/Catatan pengasuhan 90 hari:.*<b>0<\/b>/);
  });

  it("shows no such count to an account that may not read notes", () => {
    expect(panelWith(null)).not.toContain("Catatan pengasuhan");
  });
});
