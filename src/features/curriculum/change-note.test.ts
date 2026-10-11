import { describe, expect, it } from "vitest";
import { changeNote } from "./change-note";

describe("changeNote", () => {
  it("gives the starting note while nothing was changed", () => {
    expect(changeNote(null, "Diperbarui", "Isi awal, dapat disesuaikan.")).toBe(
      "Isi awal, dapat disesuaikan.",
    );
  });

  it("says when the change was made and by whom", () => {
    const changed = { at: new Date("2026-10-11T03:00:00Z"), by: "Kepala Uji" };

    expect(changeNote(changed, "Diatur", "Nilai awal 65.")).toBe(
      "Diatur 11 Okt 2026 oleh Kepala Uji.",
    );
  });

  it("gives the day in campus time", () => {
    const lateInLondon = new Date("2026-10-11T18:00:00Z");
    const changed = { at: lateInLondon, by: "Kepala Uji" };

    expect(changeNote(changed, "Diperbarui", "")).toBe(
      "Diperbarui 12 Okt 2026 oleh Kepala Uji.",
    );
  });
});
