import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { readStaffViolationParams } from "./violation-address";
import type { WarningCall, WarningCalls } from "./warning-calls";
import { NO_CALLS, WarningCallsPanel } from "./warning-calls-panel";

const CALL: WarningCall = {
  studentId: "00000000-0000-4000-8000-0000000000c1",
  name: "Penghuni Uji Panggilan",
  nim: "9900990101",
  room: "Asrama Dana Rakca, kamar 101",
  counted: 12,
  level: 2,
  causes: [
    "12 pelanggaran tercatat",
    "klarifikasi kehadiran ditolak lagi (2 kali)",
  ],
  mark: 1,
  schedule: null,
};

function calls(more: Partial<WarningCalls> = {}): WarningCalls {
  return {
    semester: { id: "p", title: "Ganjil 2026/2027" },
    calls: [CALL],
    active: 1,
    withLetter: 1,
    page: 1,
    ...more,
  };
}

function panel(shown: WarningCalls, processes = false): string {
  return renderToStaticMarkup(
    <WarningCallsPanel
      calls={shown}
      params={readStaffViolationParams({})}
      processes={processes}
    />,
  );
}

describe("WarningCallsPanel", () => {
  it("shows each resident called with the SP, the causes, the mark and Belum dijadwalkan", () => {
    const shown = panel(calls());

    expect(shown).toContain("Panggilan klarifikasi dan surat peringatan");
    expect(shown).toContain("Penghuni Uji Panggilan");
    expect(shown).toContain("9900990101 · Asrama Dana Rakca, kamar 101");
    expect(shown).toContain("Penetapan SP 2");
    expect(shown).toContain(
      "12 pelanggaran tercatat dan klarifikasi kehadiran ditolak lagi (2 kali)",
    );
    expect(shown).toContain(">SP 1<");
    expect(shown).toContain("Belum dijadwalkan");
  });

  it("shows the schedule of a call that was sent", () => {
    const shown = panel(
      calls({
        calls: [
          {
            ...CALL,
            schedule: {
              day: "2026-10-16",
              time: "16:00",
              place: "Kantor Pengelola Asrama",
            },
          },
        ],
      }),
    );

    expect(shown).toContain("16 Okt 2026 16:00 · Kantor Pengelola Asrama");
    expect(shown).not.toContain("Belum dijadwalkan");
  });

  it("says there is no call when nobody is called", () => {
    const shown = panel(calls({ calls: [], active: 0 }));

    expect(shown).toContain(NO_CALLS);
    expect(NO_CALLS).toBe("Tidak ada panggilan klarifikasi aktif.");
  });

  it("offers Proses, which opens the resident's call, only to an account that processes calls", () => {
    expect(panel(calls(), true)).toContain(
      `href="/asrama/pel?proses=${CALL.studentId}"`,
    );
    expect(panel(calls(), true)).toContain(">Proses<");
    expect(panel(calls())).not.toContain("Proses");
  });

  it("is paged, 20 residents a page", () => {
    const shown = panel(calls({ active: 45, page: 2 }));

    expect(shown).toContain("panggilan=3");
  });
});
