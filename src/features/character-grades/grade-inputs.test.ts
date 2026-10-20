import { describe, expect, it } from "vitest";
import { type GradeParts, gradeInputsOf } from "./grade-inputs";

const ANI = { id: "ani", name: "Ani", nim: "9987100401", program: "Prodi" };
const BUDI = { ...ANI, id: "budi", name: "Budi", nim: "9987100402" };

const BASE_SIKU = { score: 65, adjusted: false, note: "SIKU dasar 65" };

function partsWith(more: Partial<GradeParts> = {}): GradeParts {
  return {
    attendance: new Map([["ani", { percent: 87.5, attended: 7, counted: 8 }]]),
    mentoring: new Map([["ani", 80]]),
    siku: new Map([
      ["ani", { score: 68, adjusted: true, note: "SIKU 65 +3" }],
      ["budi", BASE_SIKU],
    ]),
    skpm: { uploadsInForce: 1, scores: new Map([["ani", 72]]) },
    ...more,
  };
}

describe("gradeInputsOf", () => {
  it("gives each student their four parts, in the order of the students", () => {
    const [ani, budi] = gradeInputsOf([ANI, BUDI], partsWith());

    expect(ani).toEqual({
      student: ANI,
      attendance: { percent: 87.5, attended: 7, counted: 8 },
      mentoring: 80,
      siku: { score: 68, adjusted: true, note: "SIKU 65 +3" },
      skpm: 72,
    });
    expect(budi).toEqual({
      student: BUDI,
      attendance: { percent: null, attended: 0, counted: 0 },
      mentoring: null,
      siku: BASE_SIKU,
      skpm: 0,
    });
  });

  it("leaves SKPM missing for everyone while no upload counts", () => {
    const parts = partsWith({ skpm: { uploadsInForce: 0, scores: new Map() } });

    const [ani] = gradeInputsOf([ANI], parts);

    expect(ani?.skpm).toBeNull();
  });

  it("refuses a student with no SIKU rather than guess one", () => {
    const parts = partsWith({ siku: new Map() });

    expect(() => gradeInputsOf([ANI], parts)).toThrow(
      "A student of the list has no SIKU.",
    );
  });
});
