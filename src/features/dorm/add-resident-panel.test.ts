import { describe, expect, it } from "vitest";
import { offeredWords } from "./add-resident-panel";

const NOBODY = { shown: [], matching: 0 };

describe("offeredWords of Tambah penghuni", () => {
  it("says there is nobody yet when nothing is searched", () => {
    expect(offeredWords(NOBODY, "")).toBe(
      "Belum ada mahasiswa aktif non asrama.",
    );
  });

  it("says nobody matches when a search finds nobody", () => {
    expect(offeredWords(NOBODY, "nama lain")).toBe(
      "Tidak ada mahasiswa aktif non asrama pada filter ini.",
    );
  });
});
