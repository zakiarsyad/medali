import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LightPenaltyLink } from "./light-penalty-link";
import type { NoteRow } from "./note-board";

const ROW: NoteRow = {
  id: "n1",
  studentId: "00000000-0000-4000-8000-000000000704",
  name: "Mega Saragih",
  nim: "9900250013",
  day: "2026-10-14",
  category: "further",
  isActive: true,
  activeNotes: 2,
  description: "Kembali terlambat mengikuti apel pagi",
  punishment: "warning",
  otherPunishment: "",
  remark: "",
  savedByName: "Agus Hermawan",
};

function link(row: NoteRow): string {
  return renderToStaticMarkup(<LightPenaltyLink row={row} />);
}

describe("LightPenaltyLink", () => {
  it("opens the form of Pelanggaran disiplin on the student of a Pelanggaran lanjutan in force", () => {
    const shown = link(ROW);
    expect(shown).toContain("Hukuman ringan");
    expect(shown).toContain(
      'href="/pembinaan/disiplin?mahasiswa=00000000-0000-4000-8000-000000000704"',
    );
  });

  it("shows nothing on a Pelanggaran pertama or a note no longer in force", () => {
    expect(link({ ...ROW, category: "first" })).toBe("");
    expect(link({ ...ROW, isActive: false })).toBe("");
  });
});
