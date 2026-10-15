import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ConsentStatusLine } from "./consent-badge";
import type { ConsentView } from "./consent-view";
import { CONSENT_TEXT } from "./consent-words";
import {
  CounsellingScreen,
  EMERGENCY_TEXT,
  HELP_TEXT,
} from "./counselling-screen";

// 10:00 on campus on 16 October 2026.
const MOMENT = new Date("2026-10-16T03:00:00Z");

describe("Konseling of Konselor", () => {
  it("shows the emergency notice with 119, and Persetujuan konseling with a student search until one is picked", () => {
    const page = renderToStaticMarkup(
      <CounsellingScreen own={null} mayManage={true} />,
    );

    expect(page).toContain("Keadaan darurat.");
    expect(EMERGENCY_TEXT).toContain("119");
    expect(page).toContain(EMERGENCY_TEXT);
    expect(page).toContain("Persetujuan konseling");
    expect(page).toContain('aria-label="Cari mahasiswa"');
    expect(page).toContain("Pilih mahasiswa untuk melihat status persetujuan");
  });

  it("shows neither to an account without the right", () => {
    const page = renderToStaticMarkup(
      <CounsellingScreen own={null} mayManage={false} />,
    );

    expect(page).not.toContain("Keadaan darurat.");
    expect(page).not.toContain("Persetujuan konseling");
  });
});

function consentOf(
  status: ConsentView["status"],
  way: ConsentView["way"] = null,
): ConsentView {
  return {
    status,
    way,
    changedAt: MOMENT,
    counsellorName: null,
    version: MOMENT.toISOString(),
  };
}

function studentPage(consent: ConsentView | null): string {
  return renderToStaticMarkup(
    <CounsellingScreen own={{ consent }} mayManage={false} />,
  );
}

function buttonsOf(page: string): string[] {
  return [...page.matchAll(/<button[^>]*>([^<]*)<\/button>/g)].map(
    (match) => match[1] ?? "",
  );
}

describe("Konseling of the student", () => {
  it("shows a waiting request with the full consent text, Setujui and Tolak", () => {
    const page = studentPage(consentOf("waiting"));

    expect(page).toContain("Permintaan persetujuan konseling");
    expect(page).toContain(CONSENT_TEXT);
    expect(buttonsOf(page)).toEqual(["Setujui", "Tolak"]);
  });

  it("shows Belum diminta and Butuh bantuan segera? with 119 to a student never asked, with no button", () => {
    const page = studentPage(null);

    expect(page).toContain("Belum diminta");
    expect(page).toContain("Butuh bantuan segera?");
    expect(HELP_TEXT).toContain("119");
    expect(page).toContain(HELP_TEXT);
    expect(buttonsOf(page)).toEqual([]);
  });

  it("shows Disetujui online with its date, and Cabut persetujuan", () => {
    const page = studentPage(consentOf("approved", "online"));

    expect(page).toContain("Disetujui");
    expect(page).toContain("Persetujuan daring · 16 Okt 2026");
    expect(buttonsOf(page)).toEqual(["Cabut persetujuan"]);
  });

  it.each([
    ["declined", "Ditolak"],
    ["withdrawn", "Dicabut"],
  ] as const)(
    "shows %s as %s with its date, with no button",
    (status, words) => {
      const page = studentPage(consentOf(status));

      expect(page).toContain(words);
      expect(page).toContain("16 Okt 2026");
      expect(buttonsOf(page)).toEqual([]);
    },
  );

  it("shows no part of Konselor to a student", () => {
    const page = studentPage(null);

    expect(page).not.toContain("Keadaan darurat.");
    expect(page).not.toContain("Cari mahasiswa");
  });

  it("shows a student who is also Konselor their own part first, then that of Konselor", () => {
    const page = renderToStaticMarkup(
      <CounsellingScreen
        own={{ consent: consentOf("waiting") }}
        mayManage={true}
      />,
    );

    const own = page.indexOf("Permintaan persetujuan konseling");
    const counsellor = page.indexOf("Keadaan darurat.");
    expect(own).toBeGreaterThan(-1);
    expect(counsellor).toBeGreaterThan(own);
  });
});

describe("the status of a consent", () => {
  it("is Belum diminta for a student never asked", () => {
    const line = renderToStaticMarkup(<ConsentStatusLine consent={null} />);

    expect(line).toContain("Belum diminta");
  });

  it("names a paper form, its date and the Konselor who recorded it", () => {
    const line = renderToStaticMarkup(
      <ConsentStatusLine
        consent={{
          status: "approved",
          way: "paper",
          changedAt: MOMENT,
          counsellorName: "Konselor Contoh",
          version: MOMENT.toISOString(),
        }}
      />,
    );

    expect(line).toContain("Disetujui");
    expect(line).toContain("Form tertulis · 16 Okt 2026 · Konselor Contoh");
  });

  it("names an online answer and its date, without a name", () => {
    const line = renderToStaticMarkup(
      <ConsentStatusLine
        consent={{
          status: "approved",
          way: "online",
          changedAt: MOMENT,
          counsellorName: null,
          version: MOMENT.toISOString(),
        }}
      />,
    );

    expect(line).toContain("Persetujuan daring · 16 Okt 2026</span>");
  });
});
