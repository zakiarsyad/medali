import { describe, expect, it } from "vitest";
import { CENTRE, labelAt, ringOf, scorePoint, shapeOf } from "./medal-shape";

describe("scorePoint", () => {
  it("puts 40 at the middle and 100 at the outer ring, Mandiri at the top", () => {
    expect(scorePoint(0, 40)).toEqual({ x: CENTRE, y: CENTRE });
    expect(scorePoint(0, 100)).toEqual({ x: 125, y: 50 });
    expect(scorePoint(0, 70)).toEqual({ x: 125, y: 87.5 });
  });

  it("puts Adaptif, the fourth value, at the bottom", () => {
    expect(scorePoint(3, 100)).toEqual({ x: 125, y: 200 });
  });

  it("keeps a score outside 40–100 on the edge of the drawing", () => {
    expect(scorePoint(0, 120)).toEqual(scorePoint(0, 100));
    expect(scorePoint(0, 10)).toEqual(scorePoint(0, 40));
  });
});

describe("shapeOf", () => {
  it("is the ring of a score when all six scores are that score", () => {
    const scores = { M: 85, E: 85, D: 85, A: 85, L: 85, I: 85 };
    expect(shapeOf(scores)).toBe(ringOf(85));
  });
});

describe("labelAt", () => {
  it("centres the names at the top and bottom, and sets the others away from the middle", () => {
    expect(labelAt(0).anchor).toBe("middle");
    expect(labelAt(1).anchor).toBe("start");
    expect(labelAt(3).anchor).toBe("middle");
    expect(labelAt(4).anchor).toBe("end");
  });
});
