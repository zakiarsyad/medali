import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { NoteInList, NoteList } from "./note-list";
import { NoteListPanel } from "./note-list-panel";

vi.mock("next/navigation", () => ({ useRouter: () => ({}) }));

const NOTE: NoteInList = {
  opensDetail: false,
  id: "0b4f6c1e-6f0e-4f55-9d0a-0d3c1e2f4e01",
  happenedOn: "2026-10-09",
  kind: "discipline_guidance",
  valueKeys: ["D", "I"],
  note: "Terlambat apel pagi.",
  followUp: "watch_two_weeks",
  studentId: "0b4f6c1e-6f0e-4f55-9d0a-0d3c1e2f4e02",
  studentName: "Mahasiswa Uji Daftar",
  writer: { name: "Pengasuh Uji", title: "M.Si." },
};

const COUNTS = {
  individual_counselling: 0,
  group_mentoring: 0,
  appreciation: 0,
  attendance_monitoring: 0,
  discipline_guidance: 21,
  parent_visit: 0,
};

function panelOf(list: Partial<NoteList>): string {
  const whole = { notes: [], matching: 0, page: 1, counts: COUNTS, ...list };
  return renderToStaticMarkup(<NoteListPanel list={whole} kind={null} />);
}

describe("NoteListPanel", () => {
  it("shows the day, the student, the kind, the values, the text, the follow-up and the writer of a note", () => {
    const panel = panelOf({ notes: [NOTE], matching: 1 });

    expect(panel).toContain("9 Okt 2026");
    expect(panel).toContain("Mahasiswa Uji Daftar");
    expect(panel).toContain("Pembinaan disiplin");
    expect(panel).toContain("Disiplin");
    expect(panel).toContain("Integritas");
    expect(panel).not.toContain("Mandiri");
    expect(panel).toContain("Terlambat apel pagi.");
    expect(panel).toContain("Tindak lanjut: Pantau dua pekan.");
    expect(panel).toContain("Dicatat oleh Pengasuh Uji, M.Si.");
  });

  it("makes the student's name a link to their detail over the same page of the list, for an account that may open it", () => {
    const panel = panelOf({
      notes: [{ ...NOTE, opensDetail: true }],
      matching: 41,
      page: 2,
    });

    expect(panel).toContain(
      `href="/pengasuhan/catatan?hal=2&amp;profil=${NOTE.studentId}"`,
    );
  });

  it("shows the name alone, as no link, for a student whose detail the account may not open", () => {
    const panel = panelOf({ notes: [NOTE], matching: 1 });

    expect(panel).toContain("<b>Mahasiswa Uji Daftar</b>");
    expect(panel).not.toContain("profil=");
  });

  it("shows no follow-up for a note that needs none", () => {
    const panel = panelOf({ notes: [{ ...NOTE, followUp: "none" }] });

    expect(panel).not.toContain("Tindak lanjut");
  });

  it("offers Semua jenis and every kind to narrow by, with the count of each kind", () => {
    const panel = panelOf({});

    expect(panel).toContain("Semua jenis");
    expect(panel).toContain('<option value="kunjungan">');
    expect(panel).toMatch(/Pembinaan disiplin <b>21<\/b>/);
    expect(panel).toMatch(/Apresiasi <b>0<\/b>/);
  });

  it("says there is no note when the list is empty, and shows no pager", () => {
    const panel = panelOf({});

    expect(panel).toContain("Belum ada catatan.");
    expect(panel).not.toContain("Berikutnya");
  });

  it("says which notes of how many the page shows, with a step to the next page", () => {
    const panel = panelOf({ notes: [NOTE], matching: 21 });

    expect(panel).toContain("1–20 dari 21 catatan");
    expect(panel).toContain('href="/pengasuhan/catatan?hal=2"');
  });
});
