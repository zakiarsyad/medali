import { describe, expect, it } from "vitest";
import { sexCounts } from "./sex-counts";

describe("sexCounts", () => {
  it("counts putra and putri apart", () => {
    const students = [
      { sex: "male" },
      { sex: "female" },
      { sex: "female" },
    ] as const;

    expect(sexCounts([...students])).toEqual({ male: 1, female: 2 });
  });

  it("counts nothing for nobody", () => {
    expect(sexCounts([])).toEqual({ male: 0, female: 0 });
  });
});
