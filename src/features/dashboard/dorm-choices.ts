import { DORM_IDS, type DormId } from "@/dorms/dorms";

/** The Asrama choice of the residents of every dorm. */
export const EVERY_DORM = "semua";
/** The Asrama choice of the Aktif students who live in no dorm. */
export const NO_DORM = "non";

/**
 * The dorms the filter offers, as the prototype names them: Wismantara
 * is one choice, for its men and its women.
 */
const DORM_GROUPS = {
  wismantara: ["wismantara_putra", "wismantara_putri"],
  dana_rakca: ["dana_rakca"],
  cipta_bakti: ["cipta_bakti"],
} as const satisfies Record<string, readonly DormId[]>;

export type DormGroup = keyof typeof DORM_GROUPS;

export const DORM_GROUP_IDS: readonly DormGroup[] = [
  "wismantara",
  "dana_rakca",
  "cipta_bakti",
];

export type DormChoice = typeof EVERY_DORM | DormGroup | typeof NO_DORM;

/** The Asrama choices, in the order the filter offers them. */
export const DORM_CHOICES: readonly DormChoice[] = [
  EVERY_DORM,
  ...DORM_GROUP_IDS,
  NO_DORM,
];

/** The dorms one choice of the filter stands for. */
export function dormsOf(group: DormGroup): readonly DormId[] {
  return DORM_GROUPS[group];
}

/**
 * How many students each Asrama choice gives, from how many live in each
 * dorm and how many in none, under null.
 */
export function heldByDormChoice(
  byDorm: ReadonlyMap<DormId | null, number>,
): Map<DormChoice, number> {
  let residents = 0;
  for (const dorm of DORM_IDS) residents += byDorm.get(dorm) ?? 0;
  const held = new Map<DormChoice, number>([[EVERY_DORM, residents]]);
  for (const group of DORM_GROUP_IDS) {
    let inGroup = 0;
    for (const dorm of dormsOf(group)) inGroup += byDorm.get(dorm) ?? 0;
    held.set(group, inGroup);
  }
  held.set(NO_DORM, byDorm.get(null) ?? 0);
  return held;
}
