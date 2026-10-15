// Sample NIMs of this file: 9986110000 to 9986110099. None is added to
// the database.
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { rejectLeaveQuestion } from "./leave-tasks";
import type { DormTasks, LeaveTask } from "./tasks-card";
import { DormTasksScreen } from "./tasks-screen";

vi.mock("./leave-actions", () => ({
  decideLeaveAction: vi.fn(),
  validateReturnAction: vi.fn(),
}));

const NOTHING: DormTasks = {
  leaves: { items: [], total: 0 },
  returns: { items: [], total: 0 },
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
