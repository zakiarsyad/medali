import { mentorLabel } from "@/ui/mentor-label";
import type { SpareMentor } from "./spare-mentors";

/** One line of "Pengasuh pengganti". */
export interface SpareChoice {
  id: string;
  /** The name alone, as the sentence beside the tick box says it. */
  name: string;
  label: string;
}

/** What marks a spare mentor of the unit of the mentor who leaves. */
export const SAME_UNIT_MARK = "(unit sama)";

const NO_UNIT = "-";

function isOfUnit(spare: SpareMentor, unit: string | null): boolean {
  if (unit === null || unit.trim() === "") return false;
  return spare.unit === unit;
}

function choice(spare: SpareMentor, isSameUnit: boolean): SpareChoice {
  const named = `${mentorLabel(spare)} · ${spare.unit ?? NO_UNIT}`;
  const label = isSameUnit ? `${named} ${SAME_UNIT_MARK}` : named;
  return { id: spare.id, name: spare.name, label };
}

/**
 * "Pengasuh pengganti" for a group whose mentor is of a unit: the spare
 * mentors of the same unit first and marked, then the others, each in
 * the order they came.
 */
export function spareChoices(
  spares: SpareMentor[],
  unit: string | null,
): SpareChoice[] {
  const same = spares.filter((spare) => isOfUnit(spare, unit));
  const others = spares.filter((spare) => !isOfUnit(spare, unit));
  return [
    ...same.map((spare) => choice(spare, true)),
    ...others.map((spare) => choice(spare, false)),
  ];
}
