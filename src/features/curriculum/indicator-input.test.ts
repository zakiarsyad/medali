import { describe, expect, it } from "vitest";
import { INDICATOR_MAX_LENGTH, parseIndicatorTexts } from "./indicator-input";
import { mainIndicators } from "./main-indicators";

const CODES = mainIndicators(new Map()).flatMap((value) =>
  value.indicators.map(({ code }) => code),
);

function sent(texts: Record<string, string>) {
  return (code: string) => texts[code] ?? `Teks ${code}`;
}

describe("parseIndicatorTexts", () => {
  it("takes all 24 texts when every one is filled", () => {
    const parsed = parseIndicatorTexts(sent({}));

    expect(parsed).toEqual({
      ok: true,
      value: CODES.map((code) => ({ code, text: `Teks ${code}` })),
    });
  });

  it("takes a text without the spaces around it", () => {
    const parsed = parseIndicatorTexts(sent({ L2: "  Teks uji  " }));

    expect(parsed.ok && parsed.value.find(({ code }) => code === "L2")).toEqual(
      { code: "L2", text: "Teks uji" },
    );
  });

  it.each([
    ["M1", "Mandiri"],
    ["E4", "Empati"],
    ["D2", "Disiplin"],
    ["A3", "Adaptif"],
    ["L1", "Loyal"],
    ["I4", "Integritas"],
  ])("refuses an empty %s and names %s", (code, name) => {
    expect(parseIndicatorTexts(sent({ [code]: "" }))).toEqual({
      ok: false,
      error: `Isi keempat level indikator ${name}.`,
    });
  });

  it("refuses a text of spaces only", () => {
    expect(parseIndicatorTexts(sent({ D3: "   " }))).toEqual({
      ok: false,
      error: "Isi keempat level indikator Disiplin.",
    });
  });

  it("names the first value with an empty text when there are several", () => {
    expect(parseIndicatorTexts(sent({ I1: "", E2: "" }))).toEqual({
      ok: false,
      error: "Isi keempat level indikator Empati.",
    });
  });

  it("refuses when nothing was sent", () => {
    expect(parseIndicatorTexts(() => "")).toEqual({
      ok: false,
      error: "Isi keempat level indikator Mandiri.",
    });
  });

  it("refuses a text over the longest length", () => {
    const long = "a".repeat(INDICATOR_MAX_LENGTH + 1);

    expect(parseIndicatorTexts(sent({ E3: long }))).toEqual({
      ok: false,
      error: "Teks indikator paling banyak 300 karakter.",
    });
  });

  it("takes a text of exactly the longest length", () => {
    const longest = "a".repeat(INDICATOR_MAX_LENGTH);

    expect(parseIndicatorTexts(sent({ E3: longest })).ok).toBe(true);
  });

  it("counts the length without the spaces around the text", () => {
    const longest = `  ${"a".repeat(INDICATOR_MAX_LENGTH)}  `;

    expect(parseIndicatorTexts(sent({ E3: longest })).ok).toBe(true);
  });
});
