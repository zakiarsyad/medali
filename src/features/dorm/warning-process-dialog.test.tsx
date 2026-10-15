import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { readStaffViolationParams } from "./violation-address";
import type { WarningProcess } from "./warning-process";
import { NO_COUNTED, WarningProcessDialog } from "./warning-process-dialog";

vi.mock("./warning-actions", () => ({
  scheduleWarningCallAction: vi.fn(),
  issueWarningLetterAction: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), back: vi.fn() }),
  unstable_rethrow: vi.fn(),
}));

// 10:00 on campus on 20 October 2026.
const NOW = new Date("2026-10-20T03:00:00Z");

const PROCESS: WarningProcess = {
  semesterTitle: "Ganjil 2026/2027",
  call: {
    studentId: "00000000-0000-4000-8000-0000000000c1",
    name: "Penghuni Uji Proses",
    nim: "9900990201",
    room: "Asrama Dana Rakca, kamar 101",
    counted: 2,
    level: 1,
    causes: ["klarifikasi kehadiran ditolak"],
    mark: null,
    schedule: null,
  },
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

function box(process: WarningProcess): string {
  return renderToStaticMarkup(
    <WarningProcessDialog
      process={process}
      params={readStaffViolationParams({})}
      now={NOW}
    />,
  );
}

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
      call: { ...PROCESS.call, level: 2, mark: 1 },
    });

    expect(shown).toContain("2. Catat klarifikasi dan terbitkan SP 2");
    expect(shown).toContain("Catatan pengajuan hukuman disiplin ke Kepala UPK");
    expect(shown).toContain(">Terbitkan SP 2 dan ajukan hukuman disiplin<");
  });

  it("shows the call already sent, with Ubah jadwal", () => {
    const shown = box({
      ...PROCESS,
      call: {
        ...PROCESS.call,
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
