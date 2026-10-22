import { describe, expect, it } from "vitest";
import { kindWords, rankOf } from "./penalty-kinds";

describe("rankOf", () => {
  it("ranks the Jenjang from Ringan pertama to Berat ketiga", () => {
    expect(rankOf("light", 1)).toBe(0);
    expect(rankOf("light", 3)).toBeLessThan(rankOf("medium", 1));
    expect(rankOf("heavy", 3)).toBe(8);
  });
});

describe("kindWords", () => {
  it("names the Kategori and the Jenjang inside a sentence", () => {
    expect(kindWords({ category: "medium", level: 2 })).toBe(
      "sedang jenjang kedua",
    );
  });
});
