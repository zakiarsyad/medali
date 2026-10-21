import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { OwnWarning } from "./own-warning";
import {
  ActivitiesWarning,
  OwnWarningBoxes,
  WarningProgressCard,
} from "./own-warning-view";

const NONE: OwnWarning = {
  semesterTitle: "Ganjil 2026/2027",
  standing: {
    counted: 3,
    rejected: 0,
    hasFirst: false,
    hasSecond: false,
    level: null,
  },
  causes: [],
  schedule: null,
  letters: [],
  rejected: [],
};

function boxes(warning: OwnWarning): string {
  return renderToStaticMarkup(
    <>
      <OwnWarningBoxes warning={warning} />
      <WarningProgressCard warning={warning} />
    </>,
  );
}

function onActivities(warning: OwnWarning): string {
  return renderToStaticMarkup(<ActivitiesWarning warning={warning} />);
}

describe("the resident's warning on Kegiatan asrama", () => {
  it("shows nothing with no rejected clarification and no SP", () => {
    expect(onActivities(NONE)).toBe("");
  });

  it("tells of the rejected clarifications and the call for SP 1, with the way to Pelanggaran", () => {
    const shown = onActivities({
      ...NONE,
      standing: { ...NONE.standing, rejected: 1, level: 1 },
    });

    expect(shown).toContain(
      "<b>1 klarifikasi kehadiran Anda ditolak</b> pada semester Ganjil 2026/2027.",
    );
    expect(shown).toContain(
      "Anda masuk <b>penetapan SP 1</b> oleh Pengelola Asrama.",
    );
    expect(shown).toContain('href="/asrama/pel"');
    expect(shown).toContain("Lihat di menu Pelanggaran");
  });

  it("after SP 1, says the SP and that one more rejection leads to SP 2", () => {
    const shown = onActivities({
      ...NONE,
      standing: { ...NONE.standing, rejected: 1, hasFirst: true },
    });

    expect(shown).toContain("Status saat ini: <b>SP 1</b>.");
    expect(shown).toContain(
      "Satu kali lagi klarifikasi kehadiran ditolak akan memicu SP 2 dan pengajuan hukuman disiplin.",
    );
    expect(shown).not.toContain("penetapan SP");
  });

  it("after SP 1 from violations alone, says the SP but promises no SP 2 from one more rejection", () => {
    const shown = onActivities({
      ...NONE,
      standing: { ...NONE.standing, counted: 7, rejected: 0, hasFirst: true },
    });

    expect(shown).toContain("Status saat ini: <b>SP 1</b>.");
    expect(shown).not.toContain("Satu kali lagi");
  });
});

describe("the resident's warning on Pelanggaran", () => {
  it("shows only the count toward the call for SP 1 while nothing more is due", () => {
    const shown = boxes(NONE);

    expect(shown).toContain("Menuju panggilan SP 1");
    expect(shown).toContain("3/7");
    expect(shown).toContain("4 pelanggaran lagi");
    expect(shown).not.toContain("Penetapan SP");
    expect(shown).not.toContain("Anda menerima");
  });

  it("shows Penetapan SP with the cause and that the call will be scheduled", () => {
    const shown = boxes({
      ...NONE,
      standing: { ...NONE.standing, counted: 7, level: 1 },
      causes: ["7 pelanggaran tercatat"],
    });

    expect(shown).toContain(
      "<b>Penetapan SP 1.</b> Dasar: 7 pelanggaran tercatat pada semester Ganjil 2026/2027. Pengelola Asrama akan menjadwalkan klarifikasi.",
    );
    expect(shown).toContain("panggilan aktif");
  });

  it("shows the call, the SP received with its day and result, and the count toward SP 2", () => {
    const shown = boxes({
      ...NONE,
      standing: {
        counted: 12,
        rejected: 0,
        hasFirst: true,
        hasSecond: false,
        level: 2,
      },
      causes: ["12 pelanggaran tercatat"],
      schedule: { day: "2026-10-21", time: "16:00", place: "Aula" },
      letters: [
        {
          level: 1,
          issuedAt: new Date("2026-10-10T09:30:00Z"),
          result: "Mahasiswa hadir dan mengakui pelanggarannya.",
          proposal: null,
        },
      ],
    });

    expect(shown).toContain(
      "Hadir untuk klarifikasi pada 21 Okt 2026 pukul 16:00 di Aula.",
    );
    expect(shown).toContain(
      "Anda menerima <b>Surat Peringatan 1</b> pada 10 Okt 2026. Hasil klarifikasi: Mahasiswa hadir dan mengakui pelanggarannya.",
    );
    expect(shown).toContain("Menuju SP 2");
    expect(shown).toContain("12/12");
  });

  it("tells the resident after SP 2 that a discipline punishment was proposed to Kepala Unit, and whether it is Diajukan or Diproses", () => {
    const secondLetter = (proposal: "proposed" | "handled") =>
      boxes({
        ...NONE,
        standing: {
          counted: 12,
          rejected: 0,
          hasFirst: true,
          hasSecond: true,
          level: null,
        },
        letters: [
          {
            level: 2,
            issuedAt: new Date("2026-10-17T09:30:00Z"),
            result: "Mahasiswa hadir dan mengakui pelanggarannya.",
            proposal,
          },
        ],
      });

    for (const [proposal, said] of [
      ["proposed", "Diajukan"],
      ["handled", "Diproses"],
    ] as const) {
      const shown = secondLetter(proposal);
      expect(shown).toContain(
        "Pengelola Asrama mengajukan proses hukuman disiplin ke Kepala Unit Pembangunan Karakter.",
      );
      expect(shown).toContain(`Status pengajuan: ${said}.`);
    }
  });
});
