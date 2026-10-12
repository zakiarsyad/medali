import { GROUP_MAX, GROUP_MIN } from "@/ui/group-size";

/** The "Ukuran target" a penetapan starts with. */
export const DEFAULT_TARGET_SIZE = 30;

/**
 * The target size that is used for what was asked: a whole number from 25
 * to 35. What is no number, and an empty field, is the starting size.
 */
export function clampTargetSize(asked: number): number {
  const whole = Math.round(asked);
  if (Number.isNaN(whole) || whole === 0) return DEFAULT_TARGET_SIZE;
  if (whole < GROUP_MIN) return GROUP_MIN;
  if (whole > GROUP_MAX) return GROUP_MAX;
  return whole;
}

/**
 * How many groups the students of one program studi and jalur are split
 * into: as many as brings a group nearest to the target, then fewer while
 * a group would hold under 25, then more while one would hold over 35.
 * Too few students for one usual group still make one group.
 */
export function groupCount(students: number, targetSize: number): number {
  if (students <= 0) return 0;
  const target = clampTargetSize(targetSize);
  let groups = Math.max(1, Math.round(students / target));
  while (groups > 1 && students / groups < GROUP_MIN) groups -= 1;
  while (students / groups > GROUP_MAX) groups += 1;
  return groups;
}
