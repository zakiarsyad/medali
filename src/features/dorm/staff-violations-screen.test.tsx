import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { OwnRecordData } from "./own-violations";
import { OwnRecord, OwnViolationsView } from "./own-violations-view";
import type { ShownReduction } from "./reduction-list";
import type { StaffViolations } from "./staff-violations";
import { StaffViolationsScreen } from "./staff-violations-screen";
import {
  readOwnViolationParams,
  readStaffViolationParams,
} from "./violation-address";
import type { AnnouncedViolation } from "./violation-announcement";
import type { WarningCalls } from "./warning-calls";

vi.mock("./appeal-actions", () => ({
  sendViolationAppealAction: vi.fn(),
  decideViolationAppealAction: vi.fn(),
}));
vi.mock("./reduction-actions", () => ({
  reduceOneViolationAction: vi.fn(),
  undoReductionAction: vi.fn(),
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
  reductions: null,
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
        reduced: false,
        reductionReason: "",
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

/** The student the account of the screen belongs to. */
const OWN_STUDENT = "00000000-0000-4000-8000-0000000000e2";

function screen(board = BOARD, reduces = false): string {
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
      proposals={null}
      warnings={WARNINGS}
      processes={false}
      ownStudentId={OWN_STUDENT}
      reduces={reduces}
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

describe("the resident's own screen", () => {
  it("is titled Asrama, as the staff screen is", () => {
    const shown = renderToStaticMarkup(
      <OwnViolationsView
        tabs={{ pagePath: "asrama", tabs: [], open: "pel" }}
        room={null}
        own={{ kind: "shown", announcement: BOARD.announcement, ...OWN }}
        params={readOwnViolationParams({})}
        now={NOW}
      />,
    );

    expect(shown).toMatch(/<h1[^>]*>Asrama<\/h1>/);
  });

  it("shows the room status in the tab's content, under the tab bar", () => {
    const shown = renderToStaticMarkup(
      <OwnViolationsView
        tabs={{
          pagePath: "asrama",
          tabs: [
            { path: "kegiatan", title: "Kegiatan asrama" },
            { path: "pel", title: "Pelanggaran asrama" },
          ],
          open: "pel",
        }}
        room="Belum diplot"
        own={{ kind: "shown", announcement: BOARD.announcement, ...OWN }}
        params={readOwnViolationParams({})}
        now={NOW}
      />,
    );

    expect(shown).not.toMatch(/class="_lede_\w+">Belum diplot/);
    expect(shown).toMatch(/<p class="_ownRoom_\w+">Belum diplot<\/p>/);
    expect(shown.indexOf("Belum diplot")).toBeGreaterThan(
      shown.indexOf("</nav>"),
    );
  });
});

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
  it("is titled Asrama, the page the tab belongs to, as every tab of it is", () => {
    expect(screen()).toMatch(/<h1[^>]*>Asrama<\/h1>/);
  });

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

/** A violation of the student in the box, announced at 21:00 on its day. */
function boxRow(day: string, more: Partial<AnnouncedViolation> = {}) {
  return {
    id: `00000000-0000-4000-8000-00000000${day.replaceAll("-", "").slice(4)}`,
    day,
    studentId: BOX_STUDENT,
    name: "Penghuni Uji Kurangi",
    nim: "9900990502",
    dorm: "dana_rakca",
    reason: "Terlambat apel pagi",
    punishment: "warning",
    otherPunishment: "",
    announcedAt: new Date(`${day}T21:00:00+07:00`),
    appeal: null,
    reduced: false,
    reductionReason: "",
    ...more,
  } satisfies AnnouncedViolation;
}

const BOX_STUDENT = "00000000-0000-4000-8000-0000000000f1";

/** The box of a student with one violation in Masa advokasi, one gone up and one reduced. */
function withBox(studentId = BOX_STUDENT): StaffViolations {
  const rows = [
    boxRow("2026-10-12", { studentId }),
    boxRow("2026-10-10", { studentId }),
    boxRow("2026-10-09", {
      studentId,
      reduced: true,
      reductionReason: "Terbukti sedang izin resmi.",
    }),
  ];
  return {
    ...BOARD,
    semester: { id: "p-1", title: "Ganjil 2026/2027" },
    student: {
      studentId,
      name: "Penghuni Uji Kurangi",
      nim: "9900990502",
      rows,
      matching: rows.length,
      page: 1,
    },
  };
}

describe("the box of one student", () => {
  it("gives Pengelola Asrama Kurangi on the violation at Naik ke Pengelola only", () => {
    const shown = screen(withBox(), true);

    expect(shown).toContain(">Pengurangan</th>");
    expect(shown.match(/>Kurangi<\/button>/g)).toHaveLength(1);
    expect(shown).toContain(">Masa advokasi</span>");
  });

  it("shows a reduced violation as Dikurangi with its reason", () => {
    const shown = screen(withBox(), true);

    expect(shown).toContain(">Dikurangi</span>");
    expect(shown).toContain("Terbukti sedang izin resmi.");
  });

  it("gives no Kurangi to an account that only reads", () => {
    const shown = screen(withBox(), false);

    expect(shown).toContain(">Naik ke Pengelola</span>");
    expect(shown).not.toContain(">Kurangi<");
    expect(shown).not.toContain(">Pengurangan</th>");
  });

  it("gives no Kurangi on the account's own violations", () => {
    const shown = screen(withBox(OWN_STUDENT), true);

    expect(shown).not.toContain(">Kurangi<");
  });
});

/** A reduction of a student, by a sample Pengelola Asrama. */
function reduction(studentId: string): ShownReduction {
  return {
    id: `${studentId.slice(0, -2)}aa`,
    studentId,
    name: "Penghuni Uji Riwayat",
    nim: "9900990501",
    day: "2026-10-09",
    reason: "Terlambat apel pagi",
    punishment: "warning",
    otherPunishment: "",
    reductionReason: "Terbukti sedang izin resmi.",
    reducedBy: "Pengelola Uji",
    reducedAt: new Date("2026-10-11T03:00:00Z"),
  };
}

function withReductions(rows: ShownReduction[]): StaffViolations {
  return {
    ...BOARD,
    reductions: { rows, matching: rows.length, page: 1 },
  };
}

describe("Riwayat pengurangan pelanggaran", () => {
  it("lists the student, the violation, the reason, who and when, with Batalkan for Pengelola Asrama", () => {
    const shown = screen(withReductions([reduction(BOX_STUDENT)]), true);

    expect(shown).toContain(">Riwayat pengurangan pelanggaran</h2>");
    for (const said of [
      "Penghuni Uji Riwayat",
      "9900990501",
      "9 Okt 2026 · Terlambat apel pagi",
      "Teguran",
      "Terbukti sedang izin resmi.",
      "Pengelola Uji",
      "11 Okt 2026 10:00",
    ]) {
      expect(shown).toContain(said);
    }
    expect(shown).toContain(">Batalkan</button>");
  });

  it("gives Kepala Unit the list without Batalkan", () => {
    const shown = screen(withReductions([reduction(BOX_STUDENT)]), false);

    expect(shown).toContain("Terbukti sedang izin resmi.");
    expect(shown).not.toContain(">Batalkan</button>");
  });

  it("gives no Batalkan on the account's own reduction", () => {
    const shown = screen(withReductions([reduction(OWN_STUDENT)]), true);

    expect(shown).not.toContain(">Batalkan</button>");
  });

  it("says when there is none", () => {
    const shown = screen(withReductions([]), true);

    expect(shown).toContain("Belum ada pengurangan pada semester ini.");
  });

  it("is not drawn for an account that does not read it", () => {
    expect(screen(BOARD, false)).not.toContain(
      "Riwayat pengurangan pelanggaran",
    );
  });
});
