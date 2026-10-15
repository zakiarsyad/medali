import { describe, expect, it } from "vitest";
import {
  manyReducedWords,
  oneReducedWords,
  reduceButtonWords,
  reduceManyQuestion,
  reduceOneQuestion,
} from "./reduction-words";

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

describe("the words of the ticks in Proses", () => {
  it("name how many are ticked on the button", () => {
    expect(reduceButtonWords(0)).toBe("Kurangi pelanggaran terpilih");
    expect(reduceButtonWords(2)).toBe("Kurangi 2 pelanggaran");
  });

  it("ask with how many will still count", () => {
    expect(reduceManyQuestion(2, "Ani", 5)).toBe(
      "Kurangi 2 pelanggaran milik Ani? Pelanggaran dihapus dari pengumuman pelanggaran. Sisa 5 pelanggaran tercatat.",
    );
  });

  it("say the call is no longer active once the count falls under the SP", () => {
    expect(manyReducedWords(2, { counted: 5, level: null })).toBe(
      "2 pelanggaran dikurangi. Panggilan klarifikasi tidak lagi aktif (5 pelanggaran tercatat).",
    );
  });

  it("say the call is still active otherwise", () => {
    expect(manyReducedWords(1, { counted: 7, level: 1 })).toBe(
      "1 pelanggaran dikurangi. Panggilan SP 1 masih aktif (7 pelanggaran tercatat).",
    );
  });

  it("say only how many without a stored period", () => {
    expect(manyReducedWords(1, null)).toBe("1 pelanggaran dikurangi.");
  });
});
