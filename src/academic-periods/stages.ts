/** The tahap of each level, from level 1 to level 4. */
export const STAGES = [
  "Penanaman",
  "Penumbuhan",
  "Pengembangan",
  "Pematangan",
] as const;

/** The indicator level, and the tahap, a semester belongs to. */
export function levelOf(semester: number): number {
  return Math.ceil(semester / 2);
}

/** The name of the tahap a semester belongs to. */
export function stageNameOf(semester: number): string {
  const name = STAGES[levelOf(semester) - 1];
  if (name === undefined) throw new Error(`Semester ${semester} has no tahap.`);
  return name;
}
