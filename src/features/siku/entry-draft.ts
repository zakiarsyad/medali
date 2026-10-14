import {
  GAIN_REASONS,
  LOSS_REASONS,
  POINTS_MAX,
  type SikuKind,
  type SikuReason,
} from "./siku-ids";
import { sikuAfter, sikuOf } from "./siku-score";

/*
 * What the form holds while it is filled in. Read by the screen parts in
 * the browser, so nothing here may take from the database code.
 */

/** A chosen student, with the points they hold now. */
export interface DraftPick {
  id: string;
  name: string;
  nim: string;
  gains: number;
  losses: number;
}

/** One row of the table under the form. */
export interface PreviewRow {
  id: string;
  name: string;
  nim: string;
  now: number;
  after: number;
}

/** The points the form starts with for each kind, as in the prototype. */
export const START_POINTS: Record<SikuKind, string> = {
  gain: "2",
  loss: "3",
};

/** The reason the form starts with for each kind: the first of its list. */
export const FIRST_REASON: Record<SikuKind, SikuReason> = {
  gain: GAIN_REASONS[0],
  loss: LOSS_REASONS[0],
};

/** The chosen students with those of `picks` not chosen yet after them. */
export function withPicks(
  chosen: readonly DraftPick[],
  picks: readonly DraftPick[],
): DraftPick[] {
  const added = [...chosen];
  for (const pick of picks) {
    if (added.some((each) => each.id === pick.id)) continue;
    added.push(pick);
  }
  return added;
}

export function withoutPick(
  chosen: readonly DraftPick[],
  id: string,
): DraftPick[] {
  return chosen.filter((pick) => pick.id !== id);
}

/**
 * The points typed, as the table counts them while they are typed: a
 * whole number from 0 to 30, and 0 for what is no number. Whether they
 * may be saved is for the server to say.
 */
export function typedPoints(typed: string): number {
  const points = Math.round(Number(typed));
  if (!Number.isFinite(points)) return 0;
  return Math.min(POINTS_MAX, Math.max(0, points));
}

/** "SIKU sekarang" and "Setelah disimpan" of each chosen student. */
export function previewOf(
  base: number,
  chosen: readonly DraftPick[],
  kind: SikuKind,
  typed: string,
): PreviewRow[] {
  const points = typedPoints(typed);
  return chosen.map((pick) => ({
    id: pick.id,
    name: pick.name,
    nim: pick.nim,
    now: sikuOf(base, pick),
    after: sikuAfter(base, pick, kind, points),
  }));
}
