import { isUsualSize } from "@/ui/group-size";

/** What the check reads of a group being prepared. */
export interface GroupToCheck {
  mentorId: string | null;
  /** How many students the group holds. */
  members: number;
}

/** What stands in the way of a penetapan, and what is only a warning. */
export interface DraftCheck {
  /** How many groups have no mentor yet. */
  withoutMentor: number;
  /** How many mentors are chosen for more than one group. */
  mentorsChosenTwice: number;
  /** How many groups hold fewer than 25 or more than 35: a warning only. */
  outsideUsualSize: number;
  /** Whether the penetapan may be submitted and fixed. */
  isComplete: boolean;
}

function mentorsChosenTwice(groups: GroupToCheck[]): number {
  const seen = new Set<string>();
  const twice = new Set<string>();
  for (const group of groups) {
    if (group.mentorId === null) continue;
    if (seen.has(group.mentorId)) twice.add(group.mentorId);
    seen.add(group.mentorId);
  }
  return twice.size;
}

/**
 * Checks the groups of a penetapan. It may be submitted and fixed only
 * when it has groups, every group has a mentor and no mentor is chosen
 * for two groups. A group of an unusual size holds nothing back: a small
 * program studi cannot fill one.
 */
export function checkDraft(groups: GroupToCheck[]): DraftCheck {
  const withoutMentor = groups.filter((g) => g.mentorId === null).length;
  const chosenTwice = mentorsChosenTwice(groups);
  return {
    withoutMentor,
    mentorsChosenTwice: chosenTwice,
    outsideUsualSize: groups.filter((g) => !isUsualSize(g.members)).length,
    isComplete: groups.length > 0 && withoutMentor === 0 && chosenTwice === 0,
  };
}
