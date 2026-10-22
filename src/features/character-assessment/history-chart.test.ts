import { describe, expect, it } from "vitest";
import {
  AXIS_LEFT,
  AXIS_RIGHT,
  CHART_HEIGHT,
  pathOf,
  xAt,
  yAt,
} from "./history-chart";

const TOP = 12;
const BOTTOM = CHART_HEIGHT - 26;

describe("the line chart of Riwayat per semester", () => {
  it("runs its scale from 40 at the bottom to 100 at the top", () => {
    expect(yAt(100)).toBe(TOP);
    expect(yAt(40)).toBe(BOTTOM);
    expect(yAt(70)).toBe((TOP + BOTTOM) / 2);
  });

  it("draws a score below 40 at the bottom edge and one above 100 at the top", () => {
    expect(yAt(30)).toBe(BOTTOM);
    expect(yAt(120)).toBe(TOP);
  });

  it("spreads the semesters from the left edge to the right one, oldest first", () => {
    expect(xAt(0, 3)).toBe(AXIS_LEFT);
    expect(xAt(1, 3)).toBe((AXIS_LEFT + AXIS_RIGHT) / 2);
    expect(xAt(2, 3)).toBe(AXIS_RIGHT);
  });

  it("puts the one point of a single semester in the middle", () => {
    expect(xAt(0, 1)).toBe((AXIS_LEFT + AXIS_RIGHT) / 2);
  });

  it("joins the scores of the semesters into one line", () => {
    expect(pathOf([100, 40])).toBe(
      `M${AXIS_LEFT} ${TOP} L${AXIS_RIGHT} ${BOTTOM}`,
    );
  });
});
