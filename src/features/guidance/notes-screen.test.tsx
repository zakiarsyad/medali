import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { NOTES_START } from "./note-address";
import type { NoteBoard, NoteRow } from "./note-board";
import { NotesScreen } from "./notes-screen";

vi.mock("next/form", () => ({
  default: ({ children }: { children: unknown }) => children,
}));

const ROW: NoteRow = {
  id: "n1",
  studentId: "s1",
  name: "Mega Saragih",
  nim: "9900250013",
  day: "2026-10-14",
  category: "further",
  isActive: true,
  activeNotes: 2,
  description: "Kembali terlambat mengikuti apel pagi",
  punishment: "other",
  otherPunishment: "Menyapu halaman",
  remark: "Sudah diingatkan.",
  savedByName: "Agus Hermawan",
};

const PAST: NoteRow = {
  ...ROW,
  id: "n2",
  category: "first",
  isActive: false,
  activeNotes: null,
  remark: "",
  punishment: "warning",
  otherPunishment: "",
};

function board(rows: NoteRow[]): NoteBoard {
  return {
    period: {
      id: "p",
      startYear: 2026,
      term: "odd",
      startsOn: "2026-08-01",
      endsOn: "2027-01-31",
    },
    numbers: { active: 4, first: 3, further: 1, repeated: 1 },
    list: { rows, matching: rows.length, page: 1 },
  };
}

function screen(rows: NoteRow[], form: string | null, actions: boolean) {
  return renderToStaticMarkup(
    <NotesScreen
      tabs={{ pagePath: "pembinaan", tabs: [], open: "catatan" }}
      board={board(rows)}
      params={NOTES_START}
      form={form}
      actionsOf={actions ? () => <button type="button">Hapus</button> : null}
    />,
  );
}

describe("NotesScreen", () => {
  it("shows the four numbers of the running semester", () => {
    const shown = screen([ROW], null, false);
    for (const label of [
      "Catatan aktif",
      "Pelanggaran pertama",
      "Pelanggaran lanjutan",
      "Mahasiswa berulang",
    ]) {
      expect(shown).toContain(label);
    }
    expect(shown).toContain("semester Ganjil 2026/2027");
  });

  it("gives a reader the line on who fills the notes, and no form or Hapus", () => {
    const shown = screen([ROW], null, false);
    expect(shown).toContain(
      "Catatan pelanggaran diisi oleh Pembina Disiplin Mahasiswa dan Kepala Unit Pembangunan Karakter.",
    );
    expect(shown).not.toContain("Hapus");
  });

  it("gives a writer the form in place of that line, and Hapus on each note", () => {
    const shown = screen([ROW], "FORMULIR", true);
    expect(shown).toContain("FORMULIR");
    expect(shown).not.toContain("diisi oleh");
    expect(shown).toContain("Hapus");
  });

  it("shows a note with its Kategori, how many active notes its student has, its Uraian, Keterangan and punishment", () => {
    const shown = screen([ROW], null, false);
    expect(shown).toContain("Pelanggaran lanjutan");
    expect(shown).toContain("9900250013 · 2 catatan aktif");
    expect(shown).toContain("Kembali terlambat mengikuti apel pagi");
    expect(shown).toContain("Sudah diingatkan.");
    expect(shown).toContain("Menyapu halaman");
    expect(shown).toContain("Agus Hermawan");
  });

  it("marks a note of a past semester Tidak berlaku", () => {
    const shown = screen([PAST], null, false);
    expect(shown).toContain("Tidak berlaku");
    expect(shown).not.toContain("catatan aktif");
  });

  it("says so when no note matches", () => {
    expect(screen([], null, false)).toContain(
      "Tidak ada catatan pelanggaran pada filter ini.",
    );
  });
});
