import { MEDALI_VALUES } from "@/ui/medali-values";
import { SCORE_MAX, SCORE_MIN } from "./assessment-ids";
import type { Scores } from "./assessment-score";

/*
 * Where the parts of the medal are drawn: a six-sided shape with one
 * corner per MEDALI value, Mandiri at the top and the others clockwise.
 * A score of 40 sits at the middle and 100 at the outer ring. These are
 * places in the drawing, which the screen scales to its width.
 */

/** The width and height of the medal itself, without its labels. */
export const MEDAL_BOX = 250;

/** The room around the medal for the names of the values. */
export const LABEL_ROOM = 70;

export const CENTRE = MEDAL_BOX / 2;

/** How far a score of 100 is from the middle. */
const RADIUS = MEDAL_BOX * 0.3;

export const RIM_RADIUS = RADIUS * 1.18;

const LABEL_RADIUS = RIM_RADIUS + 16;

/** The rings drawn behind the shape: 100, and where each predikat starts. */
export const RINGS = [100, 85, 75, 65] as const;

export interface Point {
  x: number;
  y: number;
}

export type Anchor = "start" | "middle" | "end";

/** Kept to two decimals, so the drawing reads the same on every computer. */
function rounded(value: number): number {
  return Math.round(value * 100) / 100;
}

function pointAt(place: number, distance: number): Point {
  const angle = -Math.PI / 2 + (place * 2 * Math.PI) / MEDALI_VALUES.length;
  return {
    x: rounded(CENTRE + distance * Math.cos(angle)),
    y: rounded(CENTRE + distance * Math.sin(angle)),
  };
}

function distanceOf(score: number): number {
  const share = (score - SCORE_MIN) / (SCORE_MAX - SCORE_MIN);
  return RADIUS * Math.min(1, Math.max(0, share));
}

/** Where the score of the value at a place lies. */
export function scorePoint(place: number, score: number): Point {
  return pointAt(place, distanceOf(score));
}

function pointsText(points: Point[]): string {
  return points.map(({ x, y }) => `${x},${y}`).join(" ");
}

/** The corners of the shape of six scores, for an SVG polygon. */
export function shapeOf(scores: Scores): string {
  return pointsText(
    MEDALI_VALUES.map(({ key }, place) => scorePoint(place, scores[key])),
  );
}

/** The corners of a ring where every value has the same score. */
export function ringOf(score: number): string {
  return pointsText(MEDALI_VALUES.map((_, place) => scorePoint(place, score)));
}

/** The outer end of the line from the middle to a value's corner. */
export function axisEnd(place: number): Point {
  return pointAt(place, RADIUS);
}

/** Where the name of a value stands, and which side of it the point is. */
export function labelAt(place: number): Point & { anchor: Anchor } {
  const point = pointAt(place, LABEL_RADIUS);
  const offset = point.x - CENTRE;
  if (Math.abs(offset) < 4) return { ...point, anchor: "middle" };
  return { ...point, anchor: offset > 0 ? "start" : "end" };
}
