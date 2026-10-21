// Sample NIMs of this file: 9986330100 to 9986330199.
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  CounsellingListPart,
  type CounsellorStudents,
} from "./counselling-list-panel";
import type { CounsellingStudentRow } from "./counselling-list-view";
import { NO_COUNSELLING_DATA } from "./counselling-list-words";
import { CounsellingScreen } from "./counselling-screen";

const ROW: CounsellingStudentRow = {
  studentId: "00000000-0000-4000-8000-000000000001",
  name: "Ani Daftar",
  nim: "9986330101",
  program: "D3 Akuntansi",
  consent: null,
  sessions: 0,
  nextDay: null,
  schedule: null,
  sharing: null,
};

const BUSY: CounsellingStudentRow = {
  ...ROW,
  studentId: "00000000-0000-4000-8000-000000000002",
  name: "Budi Daftar",
  nim: "9986330102",
  consent: "approved",
  sessions: 2,
  nextDay: "2026-10-28",
  schedule: { status: "scheduled", day: "2026-10-26", hour: "10:00" },
  sharing: "published",
};

function studentsOf(rows: CounsellingStudentRow[]): CounsellorStudents {
  return {
    numbers: { waitingConsent: 3, recentSessions: 12 },
    list: { rows, matching: rows.length, page: 1 },
  };
}

function render(rows: CounsellingStudentRow[]): string {
  return renderToStaticMarkup(
    <CounsellingListPart students={studentsOf(rows)} />,
  );
}

describe("the numbers of Daftar mahasiswa", () => {
  it("show Menunggu persetujuan of form consent and Sesi 30 hari terakhir", () => {
    const html = render([ROW]);
    expect(html).toContain("Menunggu persetujuan");
    expect(html).toContain("form consent");
    expect(html).toContain("Sesi 30 hari terakhir");
    expect(html).toMatch(/>3<\/dd>/);
    expect(html).toMatch(/>12<\/dd>/);
  });
});

describe("Daftar mahasiswa on Konseling", () => {
  it("shows name, NIM and program studi, and - or Belum diminta where nothing is under way", () => {
    const html = render([ROW]);
    expect(html).toContain("Daftar mahasiswa");
    expect(html).toContain("Ani Daftar");
    expect(html).toContain("9986330101 · D3 Akuntansi");
    expect(html).toContain("Belum diminta");
    expect(html).toContain('data-title="Konseling">-<');
    expect(html).toContain('data-title="Jadwal">-<');
    expect(html).toContain('data-title="Publikasi">-<');
  });

  it("shows the consent, the sessions with the next one, the active schedule and the sharing", () => {
    const html = render([BUSY]);
    expect(html).toContain("Disetujui");
    expect(html).toContain("2 sesi, berikutnya 28 Okt 2026");
    expect(html).toContain("Dijadwalkan, 26 Okt 2026 pukul 10:00");
    expect(html).toContain("Dipublikasikan");
  });

  it("makes each row a card on a phone", () => {
    const html = render([ROW]);
    expect(html).toMatch(/<table class="[^"]*stacked/);
    for (const title of [
      "Mahasiswa",
      "Persetujuan",
      "Konseling",
      "Jadwal",
      "Publikasi",
    ]) {
      expect(html).toContain(`data-title="${title}"`);
    }
  });

  it("says Belum ada data konseling. when nothing exists yet", () => {
    const html = render([]);
    expect(NO_COUNSELLING_DATA).toBe("Belum ada data konseling.");
    expect(html).toContain(NO_COUNSELLING_DATA);
    expect(html).not.toContain("<table");
  });
});

describe("Konseling with Daftar mahasiswa", () => {
  it("shows it to Konselor under the panels, before Jadwal konseling", () => {
    const page = renderToStaticMarkup(
      <CounsellingScreen
        own={null}
        mayManage={true}
        mayShare={true}
        students={studentsOf([ROW])}
      />,
    );
    const consent = page.indexOf("Persetujuan konseling");
    const sharing = page.indexOf("Publikasi data kesehatan mental");
    const list = page.indexOf("Daftar mahasiswa");
    expect(consent).toBeGreaterThan(-1);
    expect(sharing).toBeGreaterThan(consent);
    expect(list).toBeGreaterThan(sharing);
  });

  it("shows nothing of it without the list", () => {
    const page = renderToStaticMarkup(
      <CounsellingScreen own={null} mayManage={true} />,
    );
    expect(page).not.toContain("Daftar mahasiswa");
    expect(page).not.toContain("Sesi 30 hari terakhir");
  });
});
