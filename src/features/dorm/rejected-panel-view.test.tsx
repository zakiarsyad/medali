import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { readClarificationListParams } from "./clarification-address";
import type { RejectedPanel, RejectedRow } from "./rejected-panel";
import { RejectedWarningPanel } from "./rejected-panel-view";

const ROW: RejectedRow = {
  studentId: "00000000-0000-4000-8000-0000000000d1",
  name: "Penghuni Uji Panel",
  nim: "9900990401",
  room: "Asrama Dana Rakca, kamar 101",
  rejected: 2,
  lastDay: "8 Okt 2026",
  lastActivity: "Apel pagi",
  level: 2,
  causes: ["klarifikasi kehadiran ditolak lagi (2 kali)"],
  mark: 1,
};

function panel(shown: RejectedPanel): string {
  return renderToStaticMarkup(
    <RejectedWarningPanel
      panel={shown}
      params={readClarificationListParams({})}
    />,
  );
}

describe("RejectedWarningPanel", () => {
  it("lists each resident with how many were rejected, the last one and the SP status", () => {
    const shown = panel({ rows: [ROW], matching: 1, page: 1 });

    expect(shown).toContain("Klarifikasi ditolak dan penetapan SP");
    expect(shown).toContain("Penghuni Uji Panel");
    expect(shown).toContain("8 Okt 2026 · Apel pagi");
    expect(shown).toContain("Penetapan SP 2");
    expect(shown).toContain(">SP 1<");
    expect(shown).toContain("klarifikasi kehadiran ditolak lagi (2 kali)");
    expect(shown).toContain('href="/asrama/pel"');
  });

  it("says - for a resident with neither a call nor an SP", () => {
    const shown = panel({
      rows: [{ ...ROW, level: null, causes: [], mark: null }],
      matching: 1,
      page: 1,
    });

    expect(shown).toContain('data-title="Status">-</td>');
  });

  it("is paged, and shows nothing while nobody has a rejected clarification", () => {
    expect(panel({ rows: [ROW], matching: 45, page: 2 })).toContain(
      'href="/asrama/klar?sp=3"',
    );
    expect(panel({ rows: [], matching: 0, page: 1 })).toBe("");
  });
});
