import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { OutResident } from "./dashboard-leave";
import {
  LeavePanel,
  NO_MONTH_LEAVE,
  NOBODY_OUT,
} from "./dashboard-leave-panel";

const MONTH = { outing: 3, skip_activities: 1, special: 0 };
const NONE = { outing: 0, skip_activities: 0, special: 0 };

const ANI: OutResident = {
  leaveId: "leave-1",
  name: "Ani Uji Dashboard",
  kind: "outing",
  endsAt: new Date("2026-10-14T16:00:00+07:00"),
  destination: "Bintaro",
  room: "Asrama Dana Rakca, kamar 101",
  isLate: true,
};

function render(panel: Parameters<typeof LeavePanel>[0]): string {
  return renderToStaticMarkup(<LeavePanel {...panel} />);
}

describe("LeavePanel", () => {
  it("counts the requests of this month in all and of each kind", () => {
    const shown = render({ byKind: MONTH, out: null, outCount: 0 });

    expect(shown).toContain("4 pengajuan");
    expect(shown).toContain("Izin pesiar");
    expect(shown).toContain("Izin Tidak Mengikuti Kegiatan (ITMK)");
    expect(shown).toContain("Izin khusus");
  });

  it("says when there is no request this month, instead of empty bars", () => {
    const shown = render({ byKind: NONE, out: null, outCount: 0 });

    expect(shown).toContain(NO_MONTH_LEAVE);
    expect(shown).not.toContain("<meter");
  });

  it("lists who is out with the kind, time due back, Tujuan, room and Terlambat, for an account with the right", () => {
    const out = { residents: [ANI], hasMore: false };
    const shown = render({ byKind: MONTH, out, outCount: 1 });

    expect(shown).toContain("Ani Uji Dashboard");
    expect(shown).toContain("izin pesiar");
    expect(shown).toContain("14 Okt 2026");
    expect(shown).toContain("Bintaro · Asrama Dana Rakca, kamar 101");
    expect(shown).toContain(">Terlambat</span>");
    expect(shown).not.toContain("Lihat semua");
  });

  it("leads to Perizinan asrama when more are out than the list shows", () => {
    const out = { residents: [ANI], hasMore: true };
    const shown = render({ byKind: MONTH, out, outCount: 21 });

    expect(shown).toContain(
      '<a href="/asrama/izin?status=di-luar">Lihat semua di Perizinan asrama</a>',
    );
  });

  it("says Tidak ada. when nobody is out", () => {
    const out = { residents: [], hasMore: false };

    expect(render({ byKind: MONTH, out, outCount: 0 })).toContain(NOBODY_OUT);
    expect(render({ byKind: MONTH, out: null, outCount: 0 })).toContain(
      NOBODY_OUT,
    );
  });

  it("shows only how many are out to an account without the right to the names", () => {
    const shown = render({ byKind: MONTH, out: null, outCount: 2 });

    expect(shown).toContain("2 penghuni sedang di luar asrama.");
    expect(shown).not.toContain("Ani Uji Dashboard");
  });
});
