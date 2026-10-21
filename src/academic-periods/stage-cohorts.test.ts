import { describe, expect, it } from "vitest";
import { heldByStage, stageCohorts } from "./stage-cohorts";

const ODD_2026 = { startYear: 2026, term: "odd" } as const;

describe("stageCohorts", () => {
  it("puts each angkatan in the tahap of its semester", () => {
    const cohorts = stageCohorts([2026, 2025, 2024, 2023, 2022], ODD_2026);

    expect(cohorts).toEqual(
      new Map([
        [1, [2026]],
        [2, [2025]],
        [3, [2024]],
        [4, [2023, 2022]],
      ]),
    );
  });

  it("moves with the period", () => {
    const even = { startYear: 2026, term: "even" } as const;
    const nextYear = { startYear: 2027, term: "odd" } as const;

    expect(stageCohorts([2026], even)).toEqual(new Map([[1, [2026]]]));
    expect(stageCohorts([2026], nextYear)).toEqual(new Map([[2, [2026]]]));
  });

  it("puts nobody in a tahap while no period runs", () => {
    expect(stageCohorts([2026, 2025], null)).toEqual(new Map());
  });
});

describe("heldByStage", () => {
  it("adds up the students of the angkatan of each tahap", () => {
    const cohorts = stageCohorts([2026, 2023, 2022], ODD_2026);
    const held = new Map([
      [2026, 5],
      [2023, 2],
      [2022, 1],
    ]);

    expect(heldByStage(held, cohorts)).toEqual(
      new Map([
        [1, 5],
        [4, 3],
      ]),
    );
  });

  it("counts none for an angkatan that holds no student", () => {
    const cohorts = stageCohorts([2026], ODD_2026);

    expect(heldByStage(new Map(), cohorts)).toEqual(new Map([[1, 0]]));
  });
});
