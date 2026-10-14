import { describe, expect, it } from "vitest";
import {
  type DraftPick,
  previewOf,
  typedPoints,
  withoutPick,
  withPicks,
} from "./entry-draft";

const ANI: DraftPick = {
  id: "ani",
  name: "Ani",
  nim: "1",
  gains: 0,
  losses: 70,
};
const BUDI: DraftPick = {
  id: "budi",
  name: "Budi",
  nim: "2",
  gains: 4,
  losses: 0,
};

describe("withPicks and withoutPick", () => {
  it("adds each student once, keeping the order they were chosen in", () => {
    const chosen = withPicks([ANI], [BUDI, ANI]);

    expect(chosen.map((pick) => pick.id)).toEqual(["ani", "budi"]);
    expect(withoutPick(chosen, "ani").map((pick) => pick.id)).toEqual(["budi"]);
  });
});

describe("typedPoints", () => {
  it("counts whole points from 0 to 30, and 0 for what is no number", () => {
    expect(typedPoints("3")).toBe(3);
    expect(typedPoints("45")).toBe(30);
    expect(typedPoints("-2")).toBe(0);
    expect(typedPoints("dua")).toBe(0);
  });
});

describe("previewOf", () => {
  it("shows SIKU now and after the save, held within 0 to 100", () => {
    expect(previewOf(65, [ANI, BUDI], "gain", "3")).toEqual([
      { id: "ani", name: "Ani", nim: "1", now: 0, after: 0 },
      { id: "budi", name: "Budi", nim: "2", now: 69, after: 72 },
    ]);
    expect(previewOf(65, [BUDI], "loss", "5")[0]?.after).toBe(64);
  });
});
