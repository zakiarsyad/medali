import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { STARTING_SCHEME } from "@/character-grades/scheme-ids";
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
  progress: null,
  cards: {
    achievement: {
      students: 12,
      assessed: 1,
      rerata: 90,
      spread: { gold: 1, silver: 0, bronze: 0, guidance: 0 },
      averages: { M: 90, E: 90, D: 90, A: 90, L: 90, I: 90 },
      change: null,
    },
    grades: { recap: { kind: "none" }, scheme: STARTING_SCHEME },
    physical: { kind: "untested", students: 12 },
    published: { matching: 3, needCounselling: 2 },
  },
  attention: [],
  notes: [],
  noteNumbers: {
    recentNotes: 4,
    openCoaching: 2,
    penalties: 1,
    attendance: null,
  },
};

const LINKS = {
  meetings: "/pengasuhan/hadir",
  scores: "/pengasuhan/nilai",
  notes: "/pengasuhan/catatan",
};

describe("Dashboard anak asuh", () => {
  it("shows the title and the line of a Pengasuh with a group", () => {
    const html = renderToStaticMarkup(
      <MenteeScreen view={SHOWN} links={LINKS} />,
    );

    expect(html).toContain("Dashboard anak asuh");
    expect(html).toContain(
      "Empat aspek penilaian 12 anak asuh Anda di KP 26-D3PJK-01, angkatan 2026.",
    );
  });

  it("shows the four cards, Kesehatan mental by what is published to the Pengasuh", () => {
    const html = renderToStaticMarkup(
      <MenteeScreen view={SHOWN} links={LINKS} />,
    );

    expect(html).toContain("Hasil asesmen 1 dari 12 mahasiswa.");
    expect(html).toContain("Nilai karakter");
    expect(html).toContain("Belum ada hasil tes kebugaran dari 12 mahasiswa.");
    expect(html).toContain("dipublikasikan");
    expect(html).toContain(
      "2 perlu konseling. Hanya data yang disetujui mahasiswa.",
    );
    expect(html).not.toContain("diasesmen</small>");
    expect(html).not.toContain("Filter");
    expect(html).not.toContain('href="#');
  });

  it("shows Catatan pengasuhan terbaru with Tulis catatan and its four numbers", () => {
    const html = renderToStaticMarkup(
      <MenteeScreen view={SHOWN} links={LINKS} />,
    );

    expect(html).toMatch(/href="\/pengasuhan\/catatan"[^>]*>Tulis catatan</);
    expect(html).toContain("Belum ada catatan.");
    expect(html).toContain("<dt>Catatan 30 hari</dt><dd>4</dd>");
    expect(html).toContain("<dt>Perlu pembinaan</dt><dd>2</dd>");
    expect(html).toContain("<dt>Pelanggaran disiplin</dt><dd>1</dd>");
    expect(html).toContain("<dt>Rerata kehadiran kegiatan</dt><dd>-</dd>");
    expect(html).toContain("Tidak ada anak asuh yang perlu perhatian");
  });

  it("shows only the message to a Pengasuh without a group", () => {
    const html = renderToStaticMarkup(
      <MenteeScreen view={{ kind: "no_group" }} links={LINKS} />,
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
