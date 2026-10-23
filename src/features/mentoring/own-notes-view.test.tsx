import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { OwnNote } from "@/mentoring/listed-note";
import { OwnNotesView } from "./own-notes-view";

function note(place: number, more: Partial<OwnNote> = {}): OwnNote {
  return {
    id: `0b4f6c1e-6f0e-4f55-9d0a-0d3c1e2f${String(place).padStart(4, "0")}`,
    happenedOn: "2026-10-10",
    kind: "individual_counselling",
    valueKeys: ["M", "A"],
    note: `Catatan uji ${place}.`,
    followUp: "none",
    ...more,
  };
}

function viewOf(notes: OwnNote[]): string {
  return renderToStaticMarkup(<OwnNotesView notes={notes} />);
}

describe("Catatan pengasuhan on Profil saya", () => {
  it("shows how many notes there are and each note's day, kind, values, text and follow-up, never who wrote it", () => {
    const view = viewOf([note(1, { followUp: "watch_two_weeks" }), note(2)]);

    expect(view).toContain(">Catatan pengasuhan</h2>");
    expect(view).toContain("2 catatan");
    expect(view).toContain("Catatan uji 1.");
    expect(view).toContain("Tindak lanjut: ");
    expect(view).toContain("Mandiri");
    expect(view).not.toContain("Dicatat oleh");
  });

  it("says Belum ada catatan. with none", () => {
    const view = viewOf([]);

    expect(view).toContain("0 catatan");
    expect(view).toContain("Belum ada catatan.");
  });

  it("shows the first 10 notes and folds the rest behind Tampilkan semua", () => {
    const notes = Array.from({ length: 12 }, (_, place) => note(place + 1));
    const view = viewOf(notes);
    const folded = view.slice(view.indexOf("<details"));

    expect(view).toContain("Tampilkan semua</summary>");
    expect(folded).toContain("Catatan uji 11.");
    expect(folded).not.toContain("Catatan uji 10.");
    expect(viewOf(notes.slice(0, 10))).not.toContain("Tampilkan semua");
  });
});
