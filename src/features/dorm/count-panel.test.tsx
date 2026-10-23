import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { CountPanel } from "./count-panel";
import type { CountPanelView, KeptCount, Participant } from "./count-view";
import type { LeaveMarks } from "./leave-marks";
import { OWN_RECORD_NOTE } from "./own-record";
import { TEST_ONE_OFF, TEST_ROW } from "./test-activities";

vi.mock("./count-actions", () => ({ saveCountAction: vi.fn() }));

const DAY = "2026-10-14";
const PARAMS = { view: "harian", day: DAY, page: 1, counted: null } as const;
const ACTIVITIES = [TEST_ROW, TEST_ONE_OFF];

const PARTICIPANTS: Participant[] = [
  {
    id: "00000000-0000-4000-8000-0000000000a1",
    name: "Ani Wiratama",
    nim: "9937760001",
    dorm: "dana_rakca",
    room: "101",
  },
  {
    id: "00000000-0000-4000-8000-0000000000b2",
    name: "Budi Hasibuan",
    nim: "9937760002",
    dorm: "cipta_bakti",
    room: null,
  },
];
const [ANI] = PARTICIPANTS;
// 19:45 on campus on 14 October 2026.
const EVENING = new Date("2026-10-14T12:45:00Z");

function panel(
  view: CountPanelView,
  ownStudentId: string | null = null,
): string {
  return renderToStaticMarkup(
    <CountPanel
      activities={ACTIVITIES}
      view={view}
      params={PARAMS}
      today={DAY}
      ownStudentId={ownStudentId}
      onUnsaved={() => {}}
    />,
  );
}

function open(
  kept: KeptCount | null,
  onLeave: LeaveMarks = {},
  ownStudentId: string | null = null,
): string {
  return panel(
    {
      kind: "open",
      activity: TEST_ROW,
      participants: PARTICIPANTS,
      kept,
      onLeave,
    },
    ownStudentId,
  );
}

const DRAFT: KeptCount = {
  version: 1,
  savedAt: EVENING,
  announcedAt: null,
  announcedBy: null,
  marks: { [ANI?.id ?? ""]: { isAbsent: true, note: "Sakit" } },
};

describe("Penghitungan kehadiran", () => {
  it("offers a chip for each activity of the day, the one counted marked", () => {
    const shown = panel({ kind: "not_started", activity: TEST_ONE_OFF });

    expect(shown).toContain("Penghitungan kehadiran");
    expect(shown).toContain(
      `href="/asrama/kegiatan?hitung=${TEST_ROW.id}">05:30 · Apel pagi uji</a>`,
    );
    expect(shown).toContain(
      `aria-current="true" href="/asrama/kegiatan?hitung=${TEST_ONE_OFF.id}">19:00 · Malam keakraban uji</a>`,
    );
  });

  it("says an activity that has not started cannot be counted yet, and offers nothing to tick", () => {
    const shown = panel({ kind: "not_started", activity: TEST_ONE_OFF });

    expect(shown).toContain(
      "Kegiatan belum dimulai. Penghitungan dapat diisi setelah kegiatan dimulai.",
    );
    expect(shown).not.toContain('type="checkbox"');
    expect(shown).not.toContain("Simpan");
  });

  it("shows each participant with name, NIM and room, a box Tidak hadir and a Catatan, with the search and the filter", () => {
    const shown = open(null);

    expect(shown).toContain("<b>Ani Wiratama</b>");
    expect(shown).toContain("9937760001 · Kamar 101");
    expect(shown).toContain("9937760002 · Belum diplot");
    expect(shown).toContain('aria-label="Tidak hadir Budi Hasibuan"');
    expect(shown).toContain('aria-label="Catatan Ani Wiratama"');
    expect(shown).toContain('placeholder="Cari nama atau NIM"');
    expect(shown).toContain("Hanya tidak hadir atau bercatatan");
  });

  it("says a count not saved yet is not announced, and offers Simpan and Umumkan ketidakhadiran", () => {
    const shown = open(null);

    expect(shown).toContain("Belum diumumkan.");
    expect(shown).toContain("0 dari 2 peserta ditandai tidak hadir.");
    expect(shown).toContain(">Simpan</button>");
    expect(shown).toContain(">Umumkan ketidakhadiran</button>");
  });

  it("opens a draft with its ticks and notes, and the time it was saved", () => {
    const shown = open(DRAFT);

    expect(shown).toContain(
      "Belum diumumkan. Draf terakhir disimpan 14 Okt 2026, 19.45.",
    );
    expect(shown).toContain("1 dari 2 peserta ditandai tidak hadir.");
    expect(shown).toContain('aria-label="Tidak hadir Ani Wiratama" checked=""');
    expect(shown).not.toContain(
      'aria-label="Tidak hadir Budi Hasibuan" checked=""',
    );
    expect(shown).toContain('value="Sakit"');
  });

  it("offers only Umumkan ulang once the count is announced, and says by whom and when", () => {
    const shown = open({
      ...DRAFT,
      announcedAt: EVENING,
      announcedBy: "Rizky Pratama",
    });

    expect(shown).toContain(
      "Ketidakhadiran sudah diumumkan 14 Okt 2026, 19.45 oleh Rizky Pratama.",
    );
    expect(shown).not.toContain(">Simpan</button>");
    expect(shown).toContain(">Umumkan ulang</button>");
  });

  it("shows the counter's own row with its mark and the line, with no box Tidak hadir and no Catatan, with the key in capitals too", () => {
    for (const own of [ANI?.id ?? "", (ANI?.id ?? "").toUpperCase()]) {
      const shown = open(DRAFT, {}, own);

      expect(shown).toContain("<b>Ani Wiratama</b>");
      expect(shown).toContain("<b>Tidak hadir</b> · Sakit");
      expect(shown).toContain(OWN_RECORD_NOTE);
      expect(shown).not.toContain('aria-label="Tidak hadir Ani Wiratama"');
      expect(shown).not.toContain('aria-label="Catatan Ani Wiratama"');
      expect(shown).toContain('aria-label="Tidak hadir Budi Hasibuan"');
      expect(shown).toContain("1 dari 2 peserta ditandai tidak hadir.");
    }
  });

  it("shows Hadir on the counter's own row with no mark kept", () => {
    const shown = open(null, {}, ANI?.id ?? "");

    expect(shown).toMatch(/<b>Hadir<\/b>/);
    expect(shown).not.toContain('aria-label="Tidak hadir Ani Wiratama"');
  });

  it("shows a participant on approved leave as Izin or ITMK, with a box that cannot be ticked", () => {
    const [, BUDI] = PARTICIPANTS;
    const shown = open(DRAFT, {
      [ANI?.id ?? ""]: "leave",
      [BUDI?.id ?? ""]: "itmk",
    });

    expect(shown).toContain(
      'disabled="" aria-label="Tidak hadir Ani Wiratama"',
    );
    expect(shown).not.toContain(
      'aria-label="Tidak hadir Ani Wiratama" checked=""',
    );
    expect(shown).toContain(
      'disabled="" aria-label="Tidak hadir Budi Hasibuan"',
    );
    expect(shown).toContain(">Izin</span>");
    expect(shown).toContain(">Hadir · ITMK</span>");
    expect(shown).toContain("0 dari 2 peserta ditandai tidak hadir.");
  });
});
