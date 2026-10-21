import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { NoteForm, penaltiesWords } from "./note-form";
import { NoteTerms } from "./note-terms";
import { DESCRIPTION_EXAMPLES } from "./violation-note-ids";

vi.mock("./note-actions", () => ({
  noteStudentBoxAction: vi.fn(),
  saveViolationNoteAction: vi.fn(),
  searchNoteStudentsAction: vi.fn(),
}));

const KEY = "00000000-0000-4000-8000-000000000701";

function form(): string {
  return renderToStaticMarkup(
    <NoteForm newKey={KEY} today="2026-10-20" inForce="0-0-0-0" />,
  );
}

describe("NoteForm", () => {
  it("sends its key, the student picked, Tanggal up to today, Uraian, Jenis hukuman and Keterangan", () => {
    const shown = form();
    expect(shown).toContain(`name="id" value="${KEY}"`);
    expect(shown).toContain('name="studentId"');
    expect(shown).toContain('name="day"');
    expect(shown).toContain('max="2026-10-20"');
    expect(shown).toContain('name="description"');
    expect(shown).toContain('name="punishment"');
    expect(shown).toContain('name="remark"');
    expect(shown).toContain("Simpan catatan");
  });

  it("offers the ready examples of Uraian and the three punishments, and no Kategori to pick", () => {
    const shown = form();
    for (const example of DESCRIPTION_EXAMPLES) {
      expect(shown).toContain(`value="${example}"`);
    }
    for (const word of ["Pembinaan langsung", "Teguran", "Hukuman lainnya"]) {
      expect(shown).toContain(word);
    }
    expect(shown).not.toContain("Kategori");
  });
});

describe("NoteTerms", () => {
  it("names the running semester and the rules of the notes", () => {
    const shown = renderToStaticMarkup(
      <NoteTerms semester="Ganjil 2026/2027" />,
    );
    expect(shown).toContain("Ketentuan");
    expect(shown).toContain("Catatan semester Ganjil 2026/2027 berlaku");
    expect(shown).toContain("Pembinaan langsung, Teguran, Hukuman lainnya.");
  });
});

describe("penaltiesWords", () => {
  it("says how many discipline penalties the student has, and nothing for none", () => {
    expect(penaltiesWords(2)).toBe(
      " Mahasiswa ini juga punya 2 hukuman disiplin tercatat.",
    );
    expect(penaltiesWords(0)).toBe("");
  });
});
