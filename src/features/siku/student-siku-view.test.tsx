import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { OwnEntry } from "./own-siku";
import { HELD_WITHIN } from "./siku-breakdown";
import type { StudentSiku, WithheldEntry } from "./student-siku";
import { StudentSikuView } from "./student-siku-view";

function entryOf(place: number, more: Partial<OwnEntry> = {}): OwnEntry {
  return {
    id: `00000000-0000-4000-8000-${String(place).padStart(12, "0")}`,
    day: `2026-10-${String(place).padStart(2, "0")}`,
    kind: "gain",
    reason: "peer_mentoring",
    points: 2,
    note: "Tutor sebaya",
    basis: "",
    enteredAs: "assessor",
    fromFile: false,
    fromRequest: false,
    ...more,
  };
}

const WITHHELD: WithheldEntry = {
  id: "00000000-0000-4000-8000-000000000099",
  day: "2026-09-30",
  kind: "loss",
  points: 7,
  enteredAs: "head_of_unit",
  fromFile: false,
  reason: null,
};

function viewOf(siku: StudentSiku, base = 65): string {
  return renderToStaticMarkup(<StudentSikuView base={base} siku={siku} />);
}

describe("StudentSikuView", () => {
  it("shows Rincian nilai SIKU with the sum and each line of the two tables", () => {
    const view = viewOf({
      totals: { gains: 2, losses: 3 },
      entries: [
        entryOf(5, {
          kind: "loss",
          reason: "director_decision",
          points: 3,
          basis: "SK 12/2026",
          fromFile: true,
        }),
        entryOf(4),
      ],
    });

    expect(view).toContain("Rincian nilai SIKU");
    expect(view).toContain("Penambahan (1)");
    expect(view).toContain("Pengurangan (1)");
    expect(view).toContain("SIKU akhir");
    expect(view).toContain("Dasar: SK 12/2026");
    expect(view).toContain("Penilai Mahasiswa lewat unggah berkas");
    expect(view).toContain("+2");
    expect(view).toContain("−3");
    expect(view).not.toContain("Kegiatan yang dapat menambah nilai SIKU");
    expect(view).not.toContain(HELD_WITHIN);
  });

  it("says so for a table with no line", () => {
    const view = viewOf({ totals: { gains: 0, losses: 0 }, entries: [] });

    expect(view).toContain("Belum ada penambahan.");
    expect(view).toContain("Belum ada pengurangan.");
  });

  it("notes that SIKU akhir is held within 0–100", () => {
    const view = viewOf(
      { totals: { gains: 40, losses: 0 }, entries: [entryOf(1)] },
      65,
    );

    expect(view).toContain(HELD_WITHIN);
  });

  it("shows a withheld line with its date and points and without its reason and note", () => {
    const view = viewOf({
      totals: { gains: 0, losses: 7 },
      entries: [WITHHELD],
    });

    expect(view).toContain("30 Sep 2026");
    expect(view).toContain("−7");
    expect(view).toContain("Tidak ditampilkan");
    expect(view).not.toContain("Hukuman disiplin mahasiswa");
  });

  it("folds a table after 10 lines, with a way to see the rest", () => {
    const gains = Array.from({ length: 12 }, (_, place) => entryOf(28 - place));
    const view = viewOf({ totals: { gains: 24, losses: 0 }, entries: gains });

    const [shown = "", folded = ""] = view.split("Tampilkan semua (12)");
    expect(shown.match(/<tr>/g)).toHaveLength(11);
    expect(folded.match(/<tr>/g)).toHaveLength(3);
    expect(folded).toContain("17 Okt 2026");
    expect(shown).not.toContain("17 Okt 2026");
  });

  it("does not fold a table of 10 lines", () => {
    const gains = Array.from({ length: 10 }, (_, place) => entryOf(place + 1));
    const view = viewOf({ totals: { gains: 20, losses: 0 }, entries: gains });

    expect(view).not.toContain("Tampilkan semua");
  });
});
