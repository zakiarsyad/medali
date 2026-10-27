import { describe, expect, it } from "vitest";
import { offeredWords } from "./name-companion-panel";

const NOBODY = { shown: [], matching: 0 };

describe("offeredWords of Tetapkan kakak pendamping", () => {
  it("says there is nobody yet when nothing is searched", () => {
    expect(offeredWords(NOBODY, "")).toBe(
      "Belum ada mahasiswa yang dapat ditetapkan.",
    );
  });

  it("says nobody matches when a search finds nobody", () => {
    expect(offeredWords(NOBODY, "nama lain")).toBe(
      "Tidak ada mahasiswa yang dapat ditetapkan pada filter ini.",
    );
  });
});
