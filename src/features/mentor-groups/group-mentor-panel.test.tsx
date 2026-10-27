import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { GroupMentorLine } from "./group-detail";
import { GroupMentorPanel } from "./group-mentor-panel";
import { mentorAddress } from "./mentor-list-address";
import type { NeedsCoaching } from "./needs-coaching";

const MENTOR_ID = "00000000-0000-4000-8000-000000000002";

const TODAY: GroupMentorLine = {
  id: "00000000-0000-4000-8000-000000000012",
  mentorId: MENTOR_ID,
  name: "Pengasuh Uji Baru",
  title: "M.Si.",
  unit: "Unit Uji",
  startsOn: "2026-10-01",
  endsOn: null,
  endReason: null,
};

const EARLIER: GroupMentorLine = {
  id: "00000000-0000-4000-8000-000000000013",
  mentorId: "00000000-0000-4000-8000-000000000003",
  name: "Pengasuh Uji Lama",
  title: null,
  unit: null,
  startsOn: "2025-09-01",
  endsOn: "2026-09-30",
  endReason: "Uji penggantian",
};

const NOBODY = { students: 0, percent: 0 };

function panelWith(
  recentNotes: number,
  needsCoaching: NeedsCoaching = NOBODY,
): string {
  return renderToStaticMarkup(
    <GroupMentorPanel
      mentors={[]}
      mentorAddress={null}
      recentNotes={recentNotes}
      needsCoaching={needsCoaching}
    />,
  );
}

function panelOf(address: string | null): string {
  return renderToStaticMarkup(
    <GroupMentorPanel
      mentors={[TODAY, EARLIER]}
      mentorAddress={address}
      recentNotes={0}
      needsCoaching={NOBODY}
    />,
  );
}

function linksIn(html: string): string[] {
  const addresses: string[] = [];
  for (const [, address] of html.matchAll(/<a [^>]*href="([^"]*)"/g)) {
    if (address !== undefined) addresses.push(address);
  }
  return addresses;
}

describe("GroupMentorPanel", () => {
  it("shows Catatan pengasuhan 90 hari with its count", () => {
    expect(panelWith(7)).toMatch(/Catatan pengasuhan 90 hari:.*<b>7<\/b>/);
  });

  it("shows the count also when it is 0", () => {
    expect(panelWith(0)).toMatch(/Catatan pengasuhan 90 hari:.*<b>0<\/b>/);
  });

  it("shows Perlu pembinaan with its students and their share", () => {
    expect(panelWith(0, { students: 1, percent: 25 })).toMatch(
      /Perlu pembinaan:.*<b>1 mahasiswa \(25%\)<\/b>/,
    );
  });

  it("shows Perlu pembinaan also when nobody needs it", () => {
    expect(panelWith(0)).toMatch(
      /Perlu pembinaan:.*<b>0 mahasiswa \(0%\)<\/b>/,
    );
  });

  it("links the name of the mentor of today to their page, and no earlier mentor", () => {
    const html = panelOf(mentorAddress(MENTOR_ID));

    expect(html).toMatch(/<a [^>]*>Pengasuh Uji Baru, M\.Si\.<\/a>/);
    expect(linksIn(html)).toEqual([mentorAddress(MENTOR_ID)]);
  });

  it("names the mentor of today in plain words without an address", () => {
    const html = panelOf(null);

    expect(html).toContain("Pengasuh Uji Baru, M.Si.");
    expect(linksIn(html)).toEqual([]);
  });
});
