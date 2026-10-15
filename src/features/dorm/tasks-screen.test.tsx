// Sample NIMs of this file: 9986110000 to 9986110099. None is added to
// the database.
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { rejectClarificationQuestion } from "./clarification-tasks";
import { rejectLeaveQuestion } from "./leave-tasks";
import { rejectReturnQuestion } from "./return-tasks";
import type {
  ClarificationTask,
  CleaningTask,
  DormTasks,
  LeaveTask,
  ReturnTask,
} from "./tasks-card";
import { DormTasksScreen } from "./tasks-screen";

vi.mock("./clarification-actions", () => ({
  decideDormClarificationAction: vi.fn(),
}));
vi.mock("./cleaning-assessment-actions", () => ({
  validateDutyAction: vi.fn(),
  sendBackDutyAction: vi.fn(),
}));
vi.mock("./leave-actions", () => ({
  decideLeaveAction: vi.fn(),
  validateReturnAction: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

const NOTHING: DormTasks = {
  leaves: { items: [], total: 0 },
  returns: { items: [], total: 0 },
  clarifications: { items: [], total: 0 },
  cleaning: { items: [], total: 0 },
  outLate: 0,
};

const LEAVE: LeaveTask = {
  id: "00000000-0000-4000-8000-0000000000d1",
  name: "Penghuni Contoh",
  nim: "9986110001",
  room: "Asrama Dana Rakca, kamar 101",
  kind: "outing",
  start: "14 Okt 2026, 09.00",
  end: "14 Okt 2026, 16.00",
  purpose: "Membeli buku kuliah",
  destination: "Bintaro",
  startPassed: false,
};

function screenOf(tasks: DormTasks): string {
  return renderToStaticMarkup(<DormTasksScreen tasks={tasks} />);
}

describe("Tugas saya", () => {
  it("shows the title, what it is for, and the all-clear box while nothing waits", () => {
    const html = screenOf(NOTHING);

    expect(html).toContain("Tugas saya");
    expect(html).toContain("menunggu tindakan Pengelola Asrama");
    expect(html).toContain("Semua tugas sudah beres.");
  });

  it("shows no all-clear box while something waits", () => {
    const html = screenOf({ ...NOTHING, returns: { items: [], total: 1 } });

    expect(html).not.toContain("Semua tugas sudah beres.");
  });

  it("shows one number card per section, which jumps to it, and makes one with something waiting stand out", () => {
    const html = screenOf({
      ...NOTHING,
      leaves: { items: [LEAVE], total: 3 },
    });

    expect(html).toMatch(
      /<a href="#tugas-izin" class="_numberOn_\w+"><span class="_amount_\w+">3<\/span><span>Izin menunggu persetujuan<\/span><\/a>/,
    );
    expect(html).toMatch(
      /<a href="#tugas-lapor" class="_number_\w+"><span class="_amount_\w+">0<\/span><span>Laporan kembali<\/span><\/a>/,
    );
    expect(html).toContain('id="tugas-izin"');
    expect(html).toContain('id="tugas-lapor"');
  });

  it("says how many residents are out past their return time, with a link to Perizinan asrama", () => {
    const html = screenOf({ ...NOTHING, outLate: 2 });

    expect(html).toContain("Perlu dipantau:");
    expect(html).toContain("2 mahasiswa belum kembali melewati batas izin");
    expect(html).toContain('href="/asrama/izin?status=terlambat"');
  });

  it("shows no Perlu dipantau while nobody is out late, and keeps it out of the all-clear", () => {
    const html = screenOf(NOTHING);

    expect(html).not.toContain("Perlu dipantau");
    expect(screenOf({ ...NOTHING, outLate: 2 })).toContain(
      "Semua tugas sudah beres.",
    );
  });
});

describe("Izin menunggu persetujuan", () => {
  it("says Beres and Tidak ada yang menunggu. when nothing waits", () => {
    const html = screenOf(NOTHING);

    expect(html).toContain("Izin menunggu persetujuan");
    expect(html).toContain("Beres");
    expect(html).toContain("Tidak ada yang menunggu.");
  });

  it("shows how many wait, and on each card the student, NIM, room, kind, times, Keperluan and Tujuan", () => {
    const html = screenOf({
      ...NOTHING,
      leaves: { items: [LEAVE], total: 1 },
      returns: null,
      clarifications: null,
      cleaning: null,
    });

    expect(html).toContain("1 menunggu");
    for (const words of [
      "Penghuni Contoh",
      "9986110001 · Asrama Dana Rakca, kamar 101",
      "Pesiar",
      "Berangkat",
      "14 Okt 2026, 09.00",
      "Kembali",
      "14 Okt 2026, 16.00",
      "Membeli buku kuliah",
      "Tujuan",
      "Bintaro",
      "Setujui",
      "Tolak",
    ]) {
      expect(html).toContain(words);
    }
    expect(html).not.toContain("Tidak ada yang menunggu.");
    expect(html).not.toContain("Waktu mulai sudah lewat.");
    expect(html).not.toContain("Lihat semua di Perizinan asrama");
  });

  it("warns of a start that has passed, and leaves out an empty Tujuan", () => {
    const html = screenOf({
      ...NOTHING,
      leaves: {
        items: [
          {
            ...LEAVE,
            kind: "skip_activities",
            destination: "",
            startPassed: true,
          },
        ],
        total: 1,
      },
    });

    expect(html).toContain("Waktu mulai sudah lewat.");
    expect(html).toContain("Dari");
    expect(html).not.toContain("Tujuan");
  });

  it("leads to every request on Perizinan asrama when more wait than it shows", () => {
    const html = screenOf({
      ...NOTHING,
      leaves: { items: [LEAVE], total: 21 },
    });

    expect(html).toContain("21 menunggu");
    expect(html).toContain('href="/asrama/izin"');
    expect(html).toContain("Lihat semua di Perizinan asrama");
  });

  it("asks before a rejection, naming the kind, the student and the start", () => {
    expect(rejectLeaveQuestion(LEAVE)).toBe(
      "Tolak Izin pesiar Penghuni Contoh, 14 Okt 2026, 09.00?",
    );
  });
});

const REPORT: ReturnTask = {
  reportId: "00000000-0000-4000-8000-0000000000e1",
  name: "Penghuni Kembali",
  nim: "9986110002",
  room: "Asrama Dana Rakca, belum diplot",
  kind: "special",
  deadline: "14 Okt 2026, 16.00",
  reportedAt: "14 Okt 2026, 16.12",
  lateMinutes: 12,
  bamNote: "Foto jelas.",
  hasPhoto: true,
};

describe("Laporan kembali menunggu validasi", () => {
  it("says Beres when nothing waits", () => {
    const html = screenOf({ ...NOTHING, leaves: null });

    expect(html).toContain("Laporan kembali menunggu validasi");
    expect(html).toContain("Beres");
    expect(html).toContain("Tidak ada yang menunggu.");
  });

  it("shows Batas kembali, the report time and how late, Catatan BAM and the photo, which opens larger", () => {
    const html = screenOf({
      ...NOTHING,
      returns: { items: [REPORT], total: 1 },
    });

    for (const words of [
      "1 menunggu",
      "Penghuni Kembali",
      "Batas kembali",
      "14 Okt 2026, 16.00",
      "14 Okt 2026, 16.12 · terlambat 12 menit",
      "Catatan BAM",
      "Foto jelas.",
      "Validasi kembali",
      "Tolak",
    ]) {
      expect(html).toContain(words);
    }
    const photo = `/asrama/izin/foto/${REPORT.reportId}`;
    expect(html).toContain(`<a href="${photo}" target="_blank"`);
    expect(html).toContain(`src="${photo}"`);
  });

  it("says a report on time without minutes, leaves out an empty Catatan BAM, and says when no photo is kept", () => {
    const html = screenOf({
      ...NOTHING,
      returns: {
        items: [{ ...REPORT, lateMinutes: 0, bamNote: "", hasPhoto: false }],
        total: 1,
      },
    });

    expect(html).not.toContain("terlambat");
    expect(html).not.toContain("Catatan BAM");
    expect(html).toContain("Foto tidak tersimpan di sini.");
  });

  it("leads to every waiting report on Perizinan asrama when more wait than it shows", () => {
    const html = screenOf({
      ...NOTHING,
      returns: { items: [REPORT], total: 25 },
    });

    expect(html).toContain('href="/asrama/izin?status=laporan-kembali"');
  });

  it("asks before a rejection, naming the student and the report time", () => {
    expect(rejectReturnQuestion(REPORT)).toBe(
      "Tolak laporan kembali Penghuni Kembali, 14 Okt 2026, 16.12?",
    );
  });
});

const CLARIFICATION: ClarificationTask = {
  id: "00000000-0000-4000-8000-0000000000f1",
  sentAt: "2026-10-13T03:00:00.000Z",
  name: "Penghuni Klarifikasi",
  nim: "9986110003",
  room: "Asrama Dana Rakca, kamar 101",
  activity: "Apel pagi",
  held: "12 Okt 2026, 05.00–06.00",
  reason: "Sakit",
  explanation: "Demam dan beristirahat di kamar.",
  status: "verified",
  hasFile: true,
  file: {
    name: "surat-keterangan.pdf",
    isPdf: true,
    facts: "Dokumen PDF · 1 KB",
  },
  sent: "13 Okt 2026, 10.00",
  verification: {
    result: "Diterima BAM: Surat sah.",
    by: "(BAM Contoh, 13 Okt 2026, 12.00)",
  },
  decision: null,
};

describe("Klarifikasi kehadiran menunggu validasi", () => {
  it("says Beres and Tidak ada yang menunggu. when nothing waits", () => {
    const html = screenOf({ ...NOTHING, leaves: null, returns: null });

    expect(html).toContain("Klarifikasi kehadiran menunggu validasi");
    expect(html).toContain("Beres");
    expect(html).toContain("Tidak ada yang menunggu.");
  });

  it("shows the student, room, activity, reason, explanation, the file and BAM's note, with the three decisions", () => {
    const html = screenOf({
      ...NOTHING,
      clarifications: { items: [CLARIFICATION], total: 1 },
    });

    for (const words of [
      "1 menunggu",
      "Penghuni Klarifikasi",
      "9986110003 · Asrama Dana Rakca, kamar 101",
      "Apel pagi",
      "12 Okt 2026, 05.00–06.00",
      "Sakit",
      "Demam dan beristirahat di kamar.",
      "surat-keterangan.pdf",
      "Diterima BAM: Surat sah.",
      "(BAM Contoh, 13 Okt 2026, 12.00)",
      "Terima sebagai hadir",
      "Terima sebagai izin",
      ">Tolak</button>",
    ]) {
      expect(html).toContain(words);
    }
  });

  it("leads to every clarification BAM passed on when more wait than it shows", () => {
    const html = screenOf({
      ...NOTHING,
      clarifications: { items: [CLARIFICATION], total: 21 },
    });

    expect(html).toContain('href="/asrama/klar?status=diverifikasi"');
    expect(html).toContain("Lihat semua di Klarifikasi kehadiran");
  });

  it("asks before a rejection, naming the student and the activity as it was held", () => {
    expect(rejectClarificationQuestion(CLARIFICATION)).toBe(
      "Tolak klarifikasi Penghuni Klarifikasi, Apel pagi, 12 Okt 2026, 05.00–06.00?",
    );
  });
});

const ASSESSMENT: CleaningTask = {
  id: "00000000-0000-4000-8000-0000000000a1",
  day: "12 Okt 2026",
  place: "Lorong lantai 1",
  room: "Dana Rakca · Kamar 101",
  isRepeat: false,
  result: "not_met",
  judgeNote: "Lantai belum dipel.",
  judgedByName: "BAM Contoh",
  judgedAt: new Date("2026-10-12T03:00:00Z"),
};

describe("Penilaian kebersihan menunggu validasi", () => {
  it("says Beres and Tidak ada yang menunggu. when nothing waits", () => {
    const html = screenOf({
      ...NOTHING,
      leaves: null,
      returns: null,
      clarifications: null,
    });

    expect(html).toContain("Penilaian kebersihan menunggu validasi");
    expect(html).toContain("Beres");
    expect(html).toContain("Tidak ada yang menunggu.");
  });

  it("shows Tanggal, Tempat, Kamar and Penilaian BAM with the note and who assessed, with Validasi and Tolak", () => {
    const html = screenOf({
      ...NOTHING,
      cleaning: { items: [ASSESSMENT], total: 1 },
    });

    for (const words of [
      "<th>Tanggal</th>",
      "<th>Tempat</th>",
      "<th>Kamar</th>",
      "<th>Penilaian BAM</th>",
      "12 Okt 2026",
      "Lorong lantai 1",
      "Dana Rakca · Kamar 101",
      "Tidak memenuhi",
      "Lantai belum dipel.",
      "Dinilai BAM Contoh · 12 Okt 2026, 10.00",
      ">Validasi</button>",
      ">Tolak</button>",
    ]) {
      expect(html).toContain(words);
    }
    expect(html).not.toContain("Pembersihan ulang");
  });

  it("marks a repeat cleaning, and says Memenuhi without a note", () => {
    const html = screenOf({
      ...NOTHING,
      cleaning: {
        items: [
          { ...ASSESSMENT, isRepeat: true, result: "met", judgeNote: "" },
        ],
        total: 1,
      },
    });

    expect(html).toContain("Pembersihan ulang");
    expect(html).toContain("Memenuhi");
    expect(html).not.toContain("Lantai belum dipel.");
  });

  it("leads to Pembersihan asrama when more wait than it shows", () => {
    const html = screenOf({
      ...NOTHING,
      cleaning: { items: [ASSESSMENT], total: 30 },
    });

    expect(html).toContain('href="/asrama/bersih"');
    expect(html).toContain("Lihat semua di Pembersihan asrama");
  });
});
