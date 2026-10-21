import { describe, expect, it } from "vitest";
import { spreadParts, spreadWords } from "./spread-parts";

describe("spreadParts", () => {
  it("gives each predikat a part as long as its share, in the order of the scale", () => {
    const parts = spreadParts({ gold: 1, silver: 2, bronze: 0, guidance: 1 });

    expect(parts).toEqual([
      { predicate: "gold", start: 0, length: 25 },
      { predicate: "silver", start: 25, length: 50 },
      { predicate: "guidance", start: 75, length: 25 },
    ]);
  });

  it("gives no part when nobody is counted", () => {
    expect(spreadParts({ gold: 0, silver: 0, bronze: 0, guidance: 0 })).toEqual(
      [],
    );
  });
});

describe("spreadWords", () => {
  it("names every predikat with its count", () => {
    expect(spreadWords({ gold: 3, silver: 5, bronze: 0, guidance: 1 })).toBe(
      "Emas 3, Perak 5, Perunggu 0, Perlu pembinaan 1",
    );
  });
});
