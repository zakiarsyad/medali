import { SCORE_MAX, SCORE_MIN } from "@/character-scores/assessment-score";

/*
 * The drawing of "Riwayat per semester", in the units of its picture,
 * which scales to the width of the screen. The sizes are the prototype's.
 */
export const CHART_WIDTH = 560;
export const CHART_HEIGHT = 200;
const ROOM_LEFT = 34;
const ROOM_RIGHT = 24;
const ROOM_TOP = 12;
const ROOM_BOTTOM = 26;

export const AXIS_LEFT = ROOM_LEFT;
export const AXIS_RIGHT = CHART_WIDTH - ROOM_RIGHT;
const AXIS_BOTTOM = CHART_HEIGHT - ROOM_BOTTOM;
const AXIS_HEIGHT = AXIS_BOTTOM - ROOM_TOP;

/** Where the names of the semesters stand, under the lines. */
export const SEMESTER_LABEL_Y = CHART_HEIGHT - 6;

/** The scores a line runs across the chart at, with its number beside it. */
export const GRID_SCORES = [50, 65, 75, 85, 100] as const;

/** Where a semester stands across: the only one stands in the middle. */
export function xAt(place: number, count: number): number {
  const width = AXIS_RIGHT - AXIS_LEFT;
  if (count < 2) return AXIS_LEFT + width / 2;
  return AXIS_LEFT + (width * place) / (count - 1);
}

/** Where a score stands up the scale: one beyond it stands at its edge. */
export function yAt(score: number): number {
  const held = Math.min(SCORE_MAX, Math.max(SCORE_MIN, score));
  const share = (held - SCORE_MIN) / (SCORE_MAX - SCORE_MIN);
  return ROOM_TOP + AXIS_HEIGHT * (1 - share);
}

/** The line through one score of each semester, the oldest first. */
export function pathOf(scores: readonly number[]): string {
  const steps = scores.map((score, place) => {
    const move = place === 0 ? "M" : "L";
    return `${move}${xAt(place, scores.length)} ${yAt(score)}`;
  });
  return steps.join(" ");
}
