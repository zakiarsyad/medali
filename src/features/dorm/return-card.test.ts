import { describe, expect, it } from "vitest";
import { type KeptReport, reportCardOf } from "./return-card";

/** A time on campus, such as 2026-10-14T16:00, as a moment. */
function on(time: string): Date {
  return new Date(`${time}:00+07:00`);
}

const END = on("2026-10-14T16:00");
const NAMES = { verifiedBy: "Bima BAM", validatedBy: "Pak Pengelola" };

function report(more: Partial<KeptReport> = {}): KeptReport {
  return {
    id: "00000000-0000-4000-8000-0000000000a1",
    photoKey: "return-photos/a1",
    status: "waiting",
    sentAt: on("2026-10-14T16:12"),
    verifiedAt: null,
    verifyNote: "",
    validatedAt: null,
    validateNote: "",
    ...more,
  };
}

describe("reportCardOf", () => {
  it("shows a report that waits for BAM with no check yet, and how late it was sent", () => {
    expect(reportCardOf(report(), NAMES, END)).toEqual({
      id: "00000000-0000-4000-8000-0000000000a1",
      hasPhoto: true,
      status: "waiting",
      sentAt: "14 Okt 2026, 16.12",
      timeliness: { late: true, words: "Terlambat 12 menit" },
      verification: null,
      validation: null,
    });
  });

  it("shows both checks of a validated report, and who made them", () => {
    const card = reportCardOf(
      report({
        status: "validated",
        verifiedAt: on("2026-10-14T16:20"),
        verifyNote: "Foto jelas.",
        validatedAt: on("2026-10-14T16:30"),
      }),
      NAMES,
      END,
    );

    expect(card.verification).toEqual({
      by: "Bima BAM",
      result: "Diverifikasi",
      note: "Foto jelas.",
    });
    expect(card.validation).toEqual({
      by: "Pak Pengelola",
      result: "Divalidasi",
      note: "",
    });
  });

  it("names who rejected: BAM, or Pengelola after BAM verified", () => {
    const byBam = reportCardOf(
      report({
        status: "rejected",
        verifiedAt: on("2026-10-14T16:20"),
        verifyNote: "Buram.",
      }),
      NAMES,
      END,
    );
    const byManager = reportCardOf(
      report({
        status: "rejected",
        verifiedAt: on("2026-10-14T16:20"),
        validatedAt: on("2026-10-14T16:30"),
        validateNote: "Bukan asrama.",
      }),
      NAMES,
      END,
    );

    expect(byBam.verification?.result).toBe("Ditolak");
    expect(byBam.validation).toBeNull();
    expect(byManager.verification?.result).toBe("Diverifikasi");
    expect(byManager.validation).toMatchObject({
      result: "Ditolak",
      note: "Bukan asrama.",
    });
  });

  it("says there is no photo where none was kept", () => {
    expect(reportCardOf(report({ photoKey: null }), NAMES, END).hasPhoto).toBe(
      false,
    );
  });
});
