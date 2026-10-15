import { describe, expect, it } from "vitest";
import { oneReducedWords, reduceOneQuestion } from "./reduction-words";

describe("the words of one reduction", () => {
  it("ask with the day and the name before reducing", () => {
    expect(reduceOneQuestion("2026-10-12", "Ani")).toBe(
      "Kurangi pelanggaran 12 Okt 2026 milik Ani? Pelanggaran tidak lagi dihitung untuk SP dan dihapus dari pengumuman pelanggaran.",
    );
  });

  it("say the violation left the announcement", () => {
    expect(oneReducedWords("2026-10-12")).toBe(
      "Pelanggaran 12 Okt 2026 dikurangi dan dihapus dari pengumuman.",
    );
  });
});
