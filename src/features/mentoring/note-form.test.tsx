// Sample NIMs of this file: 9961000600 to 9961000699. None is added to
// the database.
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { Mentee } from "./mentees";
import { NoteForm } from "./note-form";

vi.mock("./actions", () => ({}));

const NOTE_ID = "0b4f6c1e-6f0e-4f55-9d0a-0d3c1e2f6001";
const MENTEE: Mentee = {
  id: "0b4f6c1e-6f0e-4f55-9d0a-0d3c1e2f6002",
  name: "Anak Asuh Uji Formulir",
  nim: "9961000601",
};

function formWith(startWith: Mentee | null): string {
  return renderToStaticMarkup(
    <NoteForm
      mentees={[MENTEE]}
      startWith={startWith}
      today="2026-10-13"
      noteId={NOTE_ID}
    />,
  );
}

/** The values whose box is ticked, by the letter each box sends. */
function tickedIn(form: string): string[] {
  const ticked = form.matchAll(
    /<input type="checkbox" name="valueKeys" checked="" value="(\w)"/g,
  );
  return [...ticked].map((box) => box[1] ?? "");
}

describe("NoteForm", () => {
  it("asks Mahasiswa, Jenis kegiatan, Tanggal, Nilai yang terkait, Catatan and Tindak lanjut, with Simpan catatan", () => {
    const form = formWith(null);

    for (const words of [
      "Mahasiswa",
      "Ketik nama atau NIM",
      "Jenis kegiatan",
      "Tanggal",
      "Nilai yang terkait",
      "Catatan",
      "Tindak lanjut",
      "Simpan catatan",
    ]) {
      expect(form).toContain(words);
    }
  });

  it("offers the six kinds and the five follow-ups, in the words of the screen", () => {
    const form = formWith(null);

    for (const words of [
      "Konseling individu",
      "Mentoring kelompok",
      "Apresiasi",
      "Pemantauan kehadiran",
      "Pembinaan disiplin",
      "Kunjungan orang tua/wali",
      "Tidak perlu tindak lanjut",
      "Pantau dua pekan",
      "Jadwalkan konseling lanjutan",
      "Rujuk ke psikolog kampus",
      "Libatkan orang tua/wali",
    ]) {
      expect(form).toContain(words);
    }
  });

  it("starts Tanggal on today, and offers no later day", () => {
    const field = formWith(null).match(/<input[^>]*name="happenedOn"[^>]*>/);

    expect(field?.[0]).toContain('type="date"');
    expect(field?.[0]).toContain('value="2026-10-13"');
    expect(field?.[0]).toContain('max="2026-10-13"');
  });

  it("starts with the values of the first kind ticked, among the six", () => {
    const form = formWith(null);

    expect(form.match(/name="valueKeys"/g)).toHaveLength(6);
    expect(tickedIn(form)).toEqual(["M", "A"]);
  });

  it("sends the key of its note, so a form sent twice is kept once", () => {
    expect(formWith(null)).toContain(
      `<input type="hidden" name="id" value="${NOTE_ID}"/>`,
    );
  });

  it("sends no student until one is chosen, and has no box for who wrote it", () => {
    const form = formWith(null);

    expect(form).not.toContain('name="studentId"');
    expect(form).not.toContain("Dicatat oleh");
    expect(form).not.toContain('name="writtenBy"');
  });

  it("opens with the student the address named, chosen", () => {
    const form = formWith(MENTEE);

    expect(form).toContain(
      `<input type="hidden" name="studentId" value="${MENTEE.id}"/>`,
    );
    expect(form).toContain("Anak Asuh Uji Formulir · 9961000601");
  });

  it("turns the browser's own check off, so the app's message is the one shown", () => {
    expect(/<form[^>]* novalidate=""/i.test(formWith(null))).toBe(true);
  });
});
