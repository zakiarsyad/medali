import { isUsualSize, USUAL_SIZE_WORDS } from "@/ui/group-size";
import {
  countDraftStudents,
  type DraftStudentCounts,
  type PlacedGroup,
  type PlacedStudent,
} from "./draft-students";

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
  /** How many groups hold no student. */
  withoutMembers: number;
  /** How many waiting students of the angkatan are in no group. */
  studentsOutside: number;
  /** How many members are of another program studi or jalur than their group. */
  membersInWrongGroup: number;
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
 * when it has groups, every group has a mentor and at least one member,
 * no mentor is chosen for two groups, every waiting student of the
 * angkatan is in a group, and every member is in a group of their own
 * program studi and jalur. A group of an unusual size holds nothing back:
 * a small program studi cannot fill one.
 */
export function checkDraft(
  groups: GroupToCheck[],
  students: DraftStudentCounts,
): DraftCheck {
  const found = {
    withoutMentor: groups.filter((g) => g.mentorId === null).length,
    mentorsChosenTwice: mentorsChosenTwice(groups),
    withoutMembers: groups.filter((g) => g.members === 0).length,
    studentsOutside: students.outsideDraft,
    membersInWrongGroup: students.inWrongGroup,
  };
  const nothingFound = Object.values(found).every((count) => count === 0);
  return {
    ...found,
    outsideUsualSize: groups.filter((g) => !isUsualSize(g.members)).length,
    isComplete: groups.length > 0 && nothingFound,
  };
}

/** A group as it is stored, with the mentor chosen for it and its members. */
interface StoredGroup extends PlacedGroup {
  mentor: { id: string } | null;
}

/**
 * The check of the groups of a draft as they are saved, against the
 * students of the angkatan who wait for a group today.
 */
export function checkOfGroups(
  groups: StoredGroup[],
  waiting: PlacedStudent[],
): DraftCheck {
  return checkDraft(
    groups.map((group) => ({
      mentorId: group.mentor?.id ?? null,
      members: group.members.length,
    })),
    countDraftStudents(groups, waiting),
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
  if (check.withoutMembers > 0) {
    words.push(
      `${check.withoutMembers} kelompok tidak punya anggota. Tekan "Bentuk ulang", atau pindahkan anggota dari kelompok lain pada program studi dan jalur yang sama bila ada.`,
    );
  }
  if (check.studentsOutside > 0) {
    words.push(
      `${check.studentsOutside} mahasiswa angkatan ini belum masuk kelompok mana pun pada draf. Tekan "Bentuk ulang" agar ikut dibagi ke kelompok.`,
    );
  }
  if (check.membersInWrongGroup > 0) {
    words.push(
      `${check.membersInWrongGroup} mahasiswa pada draf sudah berganti program studi atau jalur. Tekan "Bentuk ulang" agar masuk kelompok yang sesuai.`,
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
