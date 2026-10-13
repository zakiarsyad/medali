/** A group as "Kelompok pengasuhan" offers it. */
export interface GroupChoice {
  id: string;
  /** Such as "KP 24-D3PJK-01". */
  code: string;
  /** The mentor of today with the gelar, or a dash for a group without one. */
  mentor: string;
}

/** A group as the choice names it: its code, then its mentor of today. */
export function choiceWords(group: GroupChoice): string {
  return `${group.code} · ${group.mentor}`;
}

/**
 * The groups whose code or mentor name holds the text typed, in the order
 * given. Capitals make no difference. Nothing typed finds every group.
 */
export function matchingGroups(
  groups: readonly GroupChoice[],
  query: string,
): GroupChoice[] {
  const text = query.trim().toLowerCase();
  if (text === "") return [...groups];
  return groups.filter((group) => {
    const inCode = group.code.toLowerCase().includes(text);
    return inCode || group.mentor.toLowerCase().includes(text);
  });
}
