import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { ListedNote } from "@/mentoring/listed-note";
import shared from "@/ui/data-screen.module.css";
import type { StudentNotes } from "./student-notes";
import { StudentNotesView } from "./student-notes-view";

const NOTE: ListedNote = {
  id: "0b4f6c1e-6f0e-4f55-9d0a-0d3c1e2f5001",
  happenedOn: "2025-05-20",
  kind: "group_mentoring",
  valueKeys: ["L"],
  note: "Sesi refleksi bersama kelompok.",
  followUp: "none",
  studentId: "0b4f6c1e-6f0e-4f55-9d0a-0d3c1e2f5002",
  studentName: "Mahasiswa Uji Profil",
  writer: { name: "Pengasuh Uji Lama", title: null },
};

const WRITE = "/pengasuhan/catatan?tulis=0b4f6c1e-6f0e-4f55-9d0a-0d3c1e2f5002";

function viewOf(found: StudentNotes, writeAddress: string | null): string {
  return renderToStaticMarkup(
    <StudentNotesView found={found} writeAddress={writeAddress} />,
  );
}

describe("StudentNotesView", () => {
  it("lists the student's notes with their count, each under the name of who wrote it", () => {
    const view = viewOf({ notes: [NOTE], count: 1 }, null);

    expect(view).toContain("Catatan pengasuhan");
    expect(view).toContain("1 catatan");
    expect(view).toContain("20 Mei 2025");
    expect(view).toContain("Mentoring kelompok");
    expect(view).toContain("Sesi refleksi bersama kelompok.");
    expect(view).toContain("Dicatat oleh Pengasuh Uji Lama");
    expect(view).not.toContain("Belum ada catatan");
  });

  it("says there is no note for this student when there is none", () => {
    const view = viewOf({ notes: [], count: 0 }, null);

    expect(view).toContain("0 catatan");
    expect(view).toContain("Belum ada catatan untuk mahasiswa ini.");
  });

  it("shows Tulis catatan, which opens the form with the student chosen, to an account that may write for them", () => {
    const view = viewOf({ notes: [], count: 0 }, WRITE);

    expect(view).toContain("Tulis catatan");
    expect(view).toContain(`href="${WRITE}"`);
  });

  it("shows no Tulis catatan to an account that only reads", () => {
    expect(viewOf({ notes: [NOTE], count: 1 }, null)).not.toContain(
      "Tulis catatan",
    );
  });

  it("is a panel with a heading like the other panels of the detail", () => {
    const view = viewOf({ notes: [], count: 0 }, null);

    expect(view).toMatch(new RegExp(`^<section class="${shared.panel}">`));
    expect(view).toContain(
      `<h2 class="${shared.heading}">Catatan pengasuhan</h2>`,
    );
  });

  it("says when only the newest notes are shown", () => {
    const view = viewOf({ notes: [NOTE], count: 25 }, null);

    expect(view).toContain("25 catatan");
    expect(view).toContain("Menampilkan 1 catatan terbaru.");
  });
});
