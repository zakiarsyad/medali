// Sample NIMs of this file: 9986330100 to 9986330199.
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { SessionHistory, SessionView } from "@/mental-health/session-view";
import {
  FOLLOW_UP_WORDS,
  SESSION_KIND_WORDS,
} from "@/mental-health/session-words";
import { STUDENT_NOT_FOUND } from "./consent-words";
import type { CounsellingListParams } from "./counselling-list-address";
import {
  CounsellingListPart,
  type CounsellorStudents,
} from "./counselling-list-panel";
import { StudentSessions } from "./counselling-list-table";
import type { CounsellingStudentRow } from "./counselling-list-view";
import {
  NO_COUNSELLING_DATA,
  NOBODY_ON_FILTER,
} from "./counselling-list-words";
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

const ALL: CounsellingListParams = { query: "", filter: "all", page: 1 };

function studentsOf(
  rows: CounsellingStudentRow[],
  params: CounsellingListParams = ALL,
  matching = rows.length,
): CounsellorStudents {
  return {
    numbers: { waitingConsent: 3, recentSessions: 12 },
    list: { rows, matching, page: params.page },
    params,
  };
}

function render(
  rows: CounsellingStudentRow[],
  params: CounsellingListParams = ALL,
  matching = rows.length,
): string {
  return renderToStaticMarkup(
    <CounsellingListPart students={studentsOf(rows, params, matching)} />,
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

describe("the search, the filter and the pages of Daftar mahasiswa", () => {
  it("offers Cari nama atau NIM and the four choices of the filter, keeping what was chosen", () => {
    const html = render([BUSY], { query: "Budi", filter: "approved", page: 1 });
    expect(html).toContain('placeholder="Cari nama atau NIM"');
    expect(html).toContain('value="Budi"');
    for (const words of [
      "Semua",
      "Menunggu persetujuan",
      "Disetujui",
      "Ada sesi berikutnya",
    ]) {
      expect(html).toContain(`>${words}</option>`);
    }
    expect(html).toMatch(/<option value="disetujui" selected="">/);
  });

  it("says Tidak ada mahasiswa pada filter ini. when nothing matches", () => {
    const html = render([], { query: "Zz", filter: "all", page: 1 });
    expect(NOBODY_ON_FILTER).toBe("Tidak ada mahasiswa pada filter ini.");
    expect(html).toContain(NOBODY_ON_FILTER);
    expect(html).not.toContain(NO_COUNSELLING_DATA);
  });

  it("steps to the next 20 with the search and the filter kept", () => {
    const rows = Array.from({ length: 20 }, (_, place) => ({
      ...ROW,
      studentId: `00000000-0000-4000-8000-0000000001${String(place).padStart(2, "0")}`,
    }));
    const html = render(rows, { query: "Ani", filter: "waiting", page: 1 }, 21);
    expect(html).toContain("1–20 dari 21 mahasiswa");
    expect(html).toContain(
      'href="/konseling?cari=Ani&amp;filter=menunggu-persetujuan&amp;hal-mahasiswa=2"',
    );
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

describe("Rincian and Buka of a row", () => {
  it("offers Rincian, closed, with no session or note loaded with the list", () => {
    const html = render([BUSY]);
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain(">Rincian</button>");
    expect(html).not.toContain("Riwayat sesi");
    expect(html).not.toContain("Tutup");
  });

  it("offers Buka only where the panels above may show the student", () => {
    const without = render([BUSY]);
    const offered = renderToStaticMarkup(
      <CounsellingListPart
        students={studentsOf([BUSY])}
        onOpen={() => undefined}
      />,
    );
    expect(without).not.toContain(">Buka</button>");
    expect(offered).toContain(">Buka</button>");
  });

  it("shows Buka to Konselor on Konseling", () => {
    const page = renderToStaticMarkup(
      <CounsellingScreen
        own={null}
        mayManage={true}
        mayShare={true}
        students={studentsOf([BUSY])}
      />,
    );
    expect(page).toContain(">Buka</button>");
  });
});

describe("an opened Rincian", () => {
  const SESSION: SessionView = {
    id: "00000000-0000-4000-8000-000000000101",
    day: "2026-10-19",
    kind: "individual_in_person",
    topic: "academic",
    notes: "Catatan rahasia uji.",
    followUp: "next_session",
    nextDay: "2026-10-28",
    counsellorName: "Konselor Uji",
    changed: null,
    version: "2026-10-19T03:00:00.000Z",
  };

  function opened(history: SessionHistory): string {
    return renderToStaticMarkup(
      <StudentSessions
        opened={{ ok: true, value: history }}
        pending={false}
        onMore={() => undefined}
      />,
    );
  }

  it("shows each session's date, Jenis, Topik, konselor, Tindak lanjut, Sesi berikutnya and notes, with no Ubah", () => {
    const html = opened({ items: [SESSION], hasMore: false });
    expect(html).toContain("19 Okt 2026");
    expect(html).toContain(SESSION_KIND_WORDS.individual_in_person);
    expect(html).toContain("Akademik");
    expect(html).toContain("Konselor Konselor Uji");
    expect(html).toContain(FOLLOW_UP_WORDS.next_session);
    expect(html).toContain("sesi berikutnya 28 Okt 2026");
    expect(html).toContain("Catatan rahasia uji.");
    expect(html).not.toContain(">Ubah</button>");
  });

  it("says Belum ada sesi. without a session", () => {
    expect(opened({ items: [], hasMore: false })).toContain("Belum ada sesi.");
  });

  it("says why it was refused", () => {
    const html = renderToStaticMarkup(
      <StudentSessions
        opened={{ ok: false, error: STUDENT_NOT_FOUND }}
        pending={false}
        onMore={() => undefined}
      />,
    );
    expect(html).toContain(STUDENT_NOT_FOUND);
  });
});
