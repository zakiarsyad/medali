/**
 * How many counted members a kelompok pengasuhan usually holds. The
 * prototype's values, to be confirmed by the campus before launch.
 */
export const GROUP_MIN = 25;
export const GROUP_MAX = 35;

/** The usual size as the screens write it. */
export const USUAL_SIZE_WORDS = `${GROUP_MIN}–${GROUP_MAX}`;

export function isUsualSize(size: number): boolean {
  return size >= GROUP_MIN && size <= GROUP_MAX;
}

/** Whether a group holds fewer members than usual, which its page explains. */
export function isSmallGroup(size: number): boolean {
  return size < GROUP_MIN;
}

/** The members of one group on average, as a whole number. */
export function averageSize(members: number, groups: number): number {
  if (groups === 0) return 0;
  return Math.round(members / groups);
}
