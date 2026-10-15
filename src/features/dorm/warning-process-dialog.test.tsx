import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { NO_COUNTED } from "./reduce-many-form";
import { readStaffViolationParams } from "./violation-address";
import type { AnnouncedViolation } from "./violation-announcement";
import type { WarningCall } from "./warning-calls";
import type { WarningProcess } from "./warning-process";
import { NOT_CALLED_NOW, WarningProcessDialog } from "./warning-process-dialog";

vi.mock("./warning-actions", () => ({
  scheduleWarningCallAction: vi.fn(),
  issueWarningLetterAction: vi.fn(),
}));
vi.mock("./reduction-actions", () => ({
  reduceViolationsAction: vi.fn(),
  reduceOneViolationAction: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), back: vi.fn() }),
  unstable_rethrow: vi.fn(),
}));

// 10:00 on campus on 20 October 2026.
const NOW = new Date("2026-10-20T03:00:00Z");

const STUDENT = {
  studentId: "00000000-0000-4000-8000-0000000000c1",
  name: "Penghuni Uji Proses",
  nim: "9900990201",
};

const CALL: WarningCall = {
  ...STUDENT,
  room: "Asrama Dana Rakca, kamar 101",
  counted: 2,
  level: 1,
  causes: ["klarifikasi kehadiran ditolak"],
  mark: null,
  schedule: null,
};

const PROCESS: WarningProcess = {
  semesterTitle: "Ganjil 2026/2027",
  student: STUDENT,
  call: CALL,
  mark: null,
  rejected: [
    {
      id: "00000000-0000-4000-8000-0000000000c2",
      day: "5 Okt 2026",
      activity: "Apel pagi",
      reason: "Sakit",
      explanation: "Demam.",
      rejectedBy: "BAM",
      note: "Tidak ada surat dokter.",
    },
  ],
  counted: [],
};

function box(process: WarningProcess, reduces = false): string {
  return renderToStaticMarkup(
    <WarningProcessDialog
      process={process}
      params={readStaffViolationParams({})}
      now={NOW}
      reduces={reduces}
    />,
  );
}

/** A counted violation of the resident, announced at 21:00 on its day. */
function counted(day: string): AnnouncedViolation {
  return {
    id: `00000000-0000-4000-8000-00000000${day.replaceAll("-", "").slice(4)}`,
    day,
    studentId: PROCESS.student.studentId,
    name: PROCESS.student.name,
    nim: PROCESS.student.nim,
    dorm: "dana_rakca",
    reason: "Terlambat apel pagi",
    punishment: "warning",
    otherPunishment: "",
    announcedAt: new Date(`${day}T21:00:00+07:00`),
    appeal: null,
    reduced: false,
    reductionReason: "",
  };
}

describe("the ticks Kurangi in Proses", () => {
  const withCounted = {
    ...PROCESS,
    counted: [counted("2026-10-12"), counted("2026-10-11")],
  };

  it("give each counted violation a tick, Dasar pengurangan and the button, for Pengelola Asrama", () => {
    const shown = box(withCounted, true);

    expect(shown.match(/type="checkbox"/g)).toHaveLength(2);
    expect(shown).toContain(
      "Dasar pengurangan (hasil klarifikasi yang diterima)",
    );
    expect(shown).toContain(">Kurangi pelanggaran terpilih</button>");
    expect(shown).toContain("2 pelanggaran tercatat semester ini");
  });

  it("are not drawn for an account that does not reduce", () => {
    const shown = box(withCounted, false);

    expect(shown).not.toContain('type="checkbox"');
    expect(shown).not.toContain("Dasar pengurangan");
  });

  it("stay in a box of a resident no longer called, which says so in place of the two parts", () => {
    const shown = box({ ...withCounted, call: null }, true);

    expect(shown).toContain(NOT_CALLED_NOW);
    expect(shown).not.toContain("1. Jadwalkan klarifikasi");
    expect(shown).not.toContain("Terbitkan SP");
    expect(shown.match(/type="checkbox"/g)).toHaveLength(2);
  });
});

describe("the box of a resident whose SP was just issued", () => {
  it("says SP 1 was issued in place of the two parts", () => {
    const shown = box(
      {
        ...PROCESS,
        call: null,
        mark: 1,
        counted: [counted("2026-10-12")],
      },
      true,
    );

    expect(shown).toContain("SP 1 sudah terbit semester ini.");
    expect(shown).not.toContain(NOT_CALLED_NOW);
    expect(shown).not.toContain("Terbitkan SP");
    expect(shown).toContain("Kurangi pelanggaran terpilih");
  });

  it("says SP 2 was issued", () => {
    const shown = box({ ...PROCESS, call: null, mark: 2 }, true);

    expect(shown).toContain("SP 2 sudah terbit semester ini.");
    expect(shown).not.toContain(NOT_CALLED_NOW);
  });

  it("keeps the two parts while the resident is still called, with an SP before", () => {
    const shown = box({ ...PROCESS, call: { ...CALL, level: 2 }, mark: 1 });

    expect(shown).toContain("2. Catat klarifikasi dan terbitkan SP 2");
    expect(shown).not.toContain("sudah terbit semester ini");
  });
});

describe("WarningProcessDialog", () => {
  it("shows why the resident is called, the rejected clarifications, and a new call for tomorrow at 16:00 in Kantor Pengelola Asrama", () => {
    const shown = box(PROCESS);

    expect(shown).toContain("Penetapan SP 1");
    expect(shown).toContain("klarifikasi kehadiran ditolak");
    expect(shown).toContain("1. Jadwalkan klarifikasi");
    expect(shown).toContain('value="2026-10-21"');
    expect(shown).toContain('min="2026-10-20"');
    expect(shown).toContain('value="16:00"');
    expect(shown).toContain('value="Kantor Pengelola Asrama"');
    expect(shown).toContain("Kirim panggilan");
    expect(shown).toContain("1 klarifikasi kehadiran kegiatan asrama ditolak");
    expect(shown).toContain("BAM: Tidak ada surat dokter.");
    expect(shown).toContain(NO_COUNTED);
    expect(shown).toContain("2. Catat klarifikasi dan terbitkan SP 1");
    expect(shown).toContain("Hasil klarifikasi");
    expect(shown).toContain(">Terbitkan SP 1<");
    expect(shown).not.toContain("Catatan pengajuan hukuman disiplin");
  });

  it("asks for the proposal note with SP 2", () => {
    const shown = box({
      ...PROCESS,
      call: { ...CALL, level: 2, mark: 1 },
    });

    expect(shown).toContain("2. Catat klarifikasi dan terbitkan SP 2");
    expect(shown).toContain("Catatan pengajuan hukuman disiplin ke Kepala UPK");
    expect(shown).toContain(">Terbitkan SP 2 dan ajukan hukuman disiplin<");
  });

  it("shows the call already sent, with Ubah jadwal", () => {
    const shown = box({
      ...PROCESS,
      call: {
        ...CALL,
        schedule: { day: "2026-10-23", time: "09:30", place: "Aula" },
      },
    });

    expect(shown).toContain('value="2026-10-23"');
    expect(shown).toContain('value="09:30"');
    expect(shown).toContain('value="Aula"');
    expect(shown).toContain("Ubah jadwal");
    expect(shown).not.toContain("Kirim panggilan");
  });
});
