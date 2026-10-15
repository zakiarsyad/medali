import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { OwnViolationTable } from "./own-violation-table";
import type { OwnViolation } from "./own-violations";

vi.mock("./appeal-actions", () => ({
  sendViolationAppealAction: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  unstable_rethrow: vi.fn(),
}));

// 10:00 on campus on 14 October 2026.
const NOW = new Date("2026-10-14T03:00:00Z");

const ROW: OwnViolation = {
  id: "00000000-0000-4000-8000-0000000000d1",
  day: "2026-10-09",
  studentId: "00000000-0000-4000-8000-0000000000d2",
  name: "Penghuni Uji Rekam",
  nim: "9900990601",
  dorm: "dana_rakca",
  reason: "Terlambat apel pagi",
  punishment: "warning",
  otherPunishment: "",
  announcedAt: new Date("2026-10-09T14:00:00Z"),
  appeal: null,
  reduced: false,
  reductionReason: "",
  ownAppeal: null,
};

describe("Rekam jejak pelanggaran saya", () => {
  it("shows a reduced violation as Dikurangi with its reason", () => {
    const shown = renderToStaticMarkup(
      <OwnViolationTable
        rows={[
          {
            ...ROW,
            reduced: true,
            reductionReason: "Terbukti sedang izin resmi.",
          },
        ]}
        now={NOW}
      />,
    );

    expect(shown).toContain(">Dikurangi</span>");
    expect(shown).toContain("Terbukti sedang izin resmi.");
    expect(shown).not.toContain("Naik ke Pengelola");
  });

  it("shows a violation that still counts as Naik ke Pengelola", () => {
    const shown = renderToStaticMarkup(
      <OwnViolationTable rows={[ROW]} now={NOW} />,
    );

    expect(shown).toContain(">Naik ke Pengelola</span>");
    expect(shown).not.toContain("Dikurangi");
  });
});
