import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { OwnRecordData } from "./own-violations";
import { OwnRecord } from "./own-violations-view";
import type { StaffViolations } from "./staff-violations";
import { StaffViolationsScreen } from "./staff-violations-screen";
import { readStaffViolationParams } from "./violation-address";
import type { WarningCalls } from "./warning-calls";

vi.mock("./appeal-actions", () => ({
  sendViolationAppealAction: vi.fn(),
  decideViolationAppealAction: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  unstable_rethrow: vi.fn(),
}));

// 22:00 on campus on 12 October 2026, an hour after the announcement.
const NOW = new Date("2026-10-12T15:00:00Z");

const BOARD: StaffViolations = {
  numbers: { announcedToday: 1, inAppeal: 1, escalated: 0 },
  announcement: { days: [], day: null, rows: [], matching: 0, page: 1 },
  rekap: { rows: [], matching: 0, page: 1 },
  semesters: [],
  semester: null,
  student: null,
  marks: {},
  letters: [],
};

/** The own record of a BAM member who lives in the dorm, with one violation still open to appeal. */
const OWN: OwnRecordData = {
  dorm: "dana_rakca",
  recorded: 0,
  inAppeal: 1,
  accepted: 0,
  semester: null,
  periods: [],
  shownPeriod: "all",
  warning: null,
  history: {
    rows: [
      {
        id: "00000000-0000-4000-8000-0000000000e1",
        day: "2026-10-12",
        studentId: "00000000-0000-4000-8000-0000000000e2",
        name: "Penghuni Uji Layar",
        nim: "9900990001",
        dorm: "dana_rakca",
        reason: "Terlambat apel pagi",
        punishment: "warning",
        otherPunishment: "",
        announcedAt: new Date("2026-10-12T14:00:00Z"),
        appeal: null,
        ownAppeal: null,
      },
    ],
    matching: 1,
    page: 1,
  },
};

const WARNINGS: WarningCalls = {
  semester: null,
  calls: [],
  active: 3,
  withLetter: 2,
  page: 1,
};

function screen(board = BOARD): string {
  const params = readStaffViolationParams({});
  return renderToStaticMarkup(
    <StaffViolationsScreen
      tabs={{ pagePath: "asrama", tabs: [], open: "pel" }}
      params={params}
      board={board}
      now={NOW}
      form={null}
      schedule={null}
      appeals={null}
      waitingAppeals={null}
      warnings={WARNINGS}
      processes={false}
      callProcess={null}
      ownRecord={
        <OwnRecord
          own={OWN}
          now={NOW}
          title="Pelanggaran saya"
          keep={[]}
          addressOfPage={() => "/asrama/pel"}
        />
      }
    />,
  );
}

describe("the staff screen of a resident who is also staff", () => {
  it("shows their own record under the staff panels, headed as their own, with Ajukan advokasi", () => {
    const shown = screen();

    expect(shown).toContain("Rekap pelanggaran per mahasiswa");
    expect(shown).toContain(">Pelanggaran saya</h2>");
    expect(shown).toContain("Rekam jejak pelanggaran saya");
    expect(shown).toContain("Ajukan advokasi");
    expect(shown.indexOf("Pengumuman pelanggaran")).toBeLessThan(
      shown.indexOf("Pelanggaran saya</h2>"),
    );
  });
});

describe("the staff screen", () => {
  it("shows how many residents are called, with how many already have an SP, and the list of calls", () => {
    const shown = screen();

    expect(shown).toContain("Panggilan klarifikasi aktif");
    expect(shown).toContain("2 mahasiswa sudah menerima SP");
    expect(shown).toContain("Panggilan klarifikasi dan surat peringatan");
  });

  it("marks a student of the rekap with the SP of the semester", () => {
    const row = {
      name: "Penghuni Uji",
      dorm: "dana_rakca",
      escalated: 8,
      inAppeal: 0,
      accepted: 0,
    } as const;
    const shown = screen({
      ...BOARD,
      rekap: {
        rows: [
          { ...row, studentId: "s-1", nim: "9900990301" },
          { ...row, studentId: "s-2", nim: "9900990302" },
        ],
        matching: 2,
        page: 1,
      },
      marks: { "s-1": 2 },
    });

    expect(shown).toContain(">Status</th>");
    expect(shown).toContain(">SP 2</span>");
    expect(shown).not.toContain(">SP 1</span>");
  });
});
