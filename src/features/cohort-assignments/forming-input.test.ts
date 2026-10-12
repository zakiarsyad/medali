import { describe, expect, it } from "vitest";
import { parseForming, type SentForming } from "./forming-input";

const SENT: SentForming = {
  cohortYear: "2026",
  targetSize: "28",
  method: "by_nim",
  version: "3",
};

describe("parseForming", () => {
  it("reads the angkatan, the target size, the method and the version", () => {
    expect(parseForming(SENT)).toEqual({
      ok: true,
      value: { cohortYear: 2026, targetSize: 28, method: "by_nim", version: 3 },
    });
  });

  it("brings a target size outside 25 to 35 into it", () => {
    const small = parseForming({ ...SENT, targetSize: "3" });
    const large = parseForming({ ...SENT, targetSize: "400" });

    expect(small).toMatchObject({ value: { targetSize: 25 } });
    expect(large).toMatchObject({ value: { targetSize: 35 } });
  });

  it("takes the starting size for an empty target size or one that is no number", () => {
    const empty = parseForming({ ...SENT, targetSize: "" });
    const words = parseForming({ ...SENT, targetSize: "banyak" });

    expect(empty).toMatchObject({ value: { targetSize: 30 } });
    expect(words).toMatchObject({ value: { targetSize: 30 } });
  });

  it("refuses a method that is not one of the three", () => {
    const parsed = parseForming({ ...SENT, method: "acak" });

    expect(parsed).toEqual({ ok: false, error: "Pilih metode pembagian." });
  });

  it.each([
    { ...SENT, cohortYear: "26" },
    { ...SENT, cohortYear: "2026; drop" },
    { ...SENT, version: "" },
    { ...SENT, version: "-1" },
  ])("refuses what the tab would not send: %o", (sent) => {
    expect(parseForming(sent).ok).toBe(false);
  });
});
