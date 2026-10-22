import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DashboardSwitch } from "./dashboard-switch";
import type { MenteeDashboard } from "./mentee-recap";
import { MenteeScreen } from "./mentee-screen";
import { NO_GROUP_HELD } from "./mentee-words";

const SHOWN: MenteeDashboard = {
  kind: "shown",
  students: 12,
  groups: [
    {
      id: "a",
      cohortYear: 2026,
      entryPath: "regular",
      number: 1,
      programCode: "D3PJK",
    },
  ],
};

describe("Dashboard anak asuh", () => {
  it("shows the title and the line of a Pengasuh with a group", () => {
    const html = renderToStaticMarkup(<MenteeScreen view={SHOWN} />);

    expect(html).toContain("Dashboard anak asuh");
    expect(html).toContain(
      "Empat aspek penilaian 12 anak asuh Anda di KP 26-D3PJK-01, angkatan 2026.",
    );
  });

  it("shows only the message to a Pengasuh without a group", () => {
    const html = renderToStaticMarkup(
      <MenteeScreen view={{ kind: "no_group" }} />,
    );

    expect(html).toContain("Dashboard anak asuh");
    expect(html).toContain(NO_GROUP_HELD);
    expect(html).not.toContain("Empat aspek");
  });
});

describe("the switch between the two Dashboards", () => {
  it("leads to each view, the open one marked", () => {
    const html = renderToStaticMarkup(
      <DashboardSwitch kinds={["character", "mentees"]} open="mentees" />,
    );

    expect(html).toContain('href="/dashboard?tampilan=karakter"');
    expect(html).toContain("Dashboard pembangunan karakter");
    expect(html).toContain('href="/dashboard?tampilan=anak-asuh"');
    expect(html).toMatch(
      /<a[^>]*aria-current="page"[^>]*>Dashboard anak asuh</,
    );
  });

  it("does not show for an account with one view", () => {
    expect(
      renderToStaticMarkup(
        <DashboardSwitch kinds={["mentees"]} open="mentees" />,
      ),
    ).toBe("");
  });
});
