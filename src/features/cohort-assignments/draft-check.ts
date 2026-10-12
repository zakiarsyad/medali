import { isUsualSize, USUAL_SIZE_WORDS } from "@/ui/group-size";

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

/** A group as it is stored, with the mentor chosen for it and its members. */
interface StoredGroup {
  mentor: { id: string } | null;
  members: unknown[];
}

/** The check of the groups of a draft as they are saved. */
export function checkOfGroups(groups: StoredGroup[]): DraftCheck {
  return checkDraft(
    groups.map((group) => ({
      mentorId: group.mentor?.id ?? null,
      members: group.members.length,
    })),
  );
}

/** What the draft says when nothing stands in the way of its penetapan. */
export const READY_WORDS =
  "Semua kelompok sudah punya pengasuh yang berbeda dan siap ditetapkan.";

/** One sentence for each thing that holds the penetapan back. */
function heldBackWords(check: DraftCheck): string[] {
  const words: string[] = [];
  if (check.withoutMentor > 0) {
    words.push(`${check.withoutMentor} kelompok belum punya pengasuh.`);
  }
  if (check.mentorsChosenTwice > 0) {
    words.push(
      `${check.mentorsChosenTwice} pengasuh dipilih untuk lebih dari satu kelompok.`,
    );
  }
  return words;
}

const HELD_BACK = "Draf belum bisa diajukan atau ditetapkan.";

/**
 * What a submit or a penetapan of a draft that is not complete is told,
 * or null for a draft that may be submitted and fixed.
 */
export function whatHoldsBack(check: DraftCheck): string | null {
  if (check.isComplete) return null;
  return [HELD_BACK, ...heldBackWords(check)].join(" ");
}

/**
 * What the note under the groups says of a check, one sentence for each
 * thing found: first what holds the penetapan back, then the warning.
 */
export function checkWords(check: DraftCheck): string[] {
  const words = heldBackWords(check);
  if (check.outsideUsualSize > 0) {
    words.push(
      `${check.outsideUsualSize} kelompok di luar ukuran ${USUAL_SIZE_WORDS} (boleh, misalnya prodi kecil).`,
    );
  }
  if (check.isComplete) words.push(READY_WORDS);
  return words;
}
