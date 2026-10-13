import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { GroupMentorPanel } from "./group-mentor-panel";

function panelWith(recentNotes: number): string {
  return renderToStaticMarkup(
    <GroupMentorPanel mentors={[]} recentNotes={recentNotes} />,
  );
}

describe("GroupMentorPanel", () => {
  it("shows Catatan pengasuhan 90 hari with its count", () => {
    expect(panelWith(7)).toMatch(/Catatan pengasuhan 90 hari:.*<b>7<\/b>/);
  });

  it("shows the count also when it is 0", () => {
    expect(panelWith(0)).toMatch(/Catatan pengasuhan 90 hari:.*<b>0<\/b>/);
  });

  it("shows the number alone, and nothing of a note", () => {
    expect(panelWith(7)).not.toContain("Dicatat oleh");
  });
});
