import type { FormedGroup } from "./form-groups";

/** A group of a complete draft, as its penetapan reads it. */
export interface GroupToFix extends FormedGroup {
  mentorId: string;
}

/** The place and number a group holds among the groups in force. */
export type GroupNumber = Pick<
  FormedGroup,
  "studyProgramId" | "entryPath" | "number"
>;

/** What the penetapan of a draft is checked against, all read at the server. */
export interface FixFacts {
  groups: GroupToFix[];
  /** The students of the angkatan who still wait for a group. */
  waitingIds: string[];
  /** The mentors that may be chosen for the angkatan today. */
  offeredMentorIds: string[];
  /** The numbers the groups in force of the angkatan hold. */
  liveNumbers: GroupNumber[];
}

const FORM_AGAIN = "Bentuk ulang kelompok, lalu tetapkan lagi.";

function membersNotWaiting(facts: FixFacts): number {
  const waiting = new Set(facts.waitingIds);
  let count = 0;
  for (const group of facts.groups) {
    count += group.studentIds.filter((id) => !waiting.has(id)).length;
  }
  return count;
}

/** How many of the mentors chosen, one for each group, are not offered. */
export function countNotOffered(
  chosenIds: string[],
  offeredIds: string[],
): number {
  const offered = new Set(offeredIds);
  return chosenIds.filter((id) => !offered.has(id)).length;
}

/** What is said of a draft that names mentors who are not offered any more. */
export function notOfferedWords(count: number): string {
  return `${count} pengasuh pada draf tidak bisa dipilih lagi untuk angkatan ini. Pilih pengasuh lain untuk kelompoknya, lalu tetapkan lagi.`;
}

function mentorsNotOffered(facts: FixFacts): number {
  const chosenIds = facts.groups.map((group) => group.mentorId);
  return countNotOffered(chosenIds, facts.offeredMentorIds);
}

function holdsNumberOf(live: GroupNumber, group: GroupNumber): boolean {
  return (
    live.studyProgramId === group.studyProgramId &&
    live.entryPath === group.entryPath &&
    live.number === group.number
  );
}

function numbersTaken(facts: FixFacts): number {
  return facts.groups.filter((group) =>
    facts.liveNumbers.some((live) => holdsNumberOf(live, group)),
  ).length;
}

/**
 * What stops the penetapan of a complete draft because of something that
 * changed after the draft was saved, or null when nothing does. A member
 * who got a group some other way or moved to another angkatan would be
 * put in a group wrongly; so would a mentor who became Tidak aktif or
 * took a group of another angkatan; and a number that a group in force
 * holds cannot be given twice. No one is named. A member who was removed
 * or is not Aktif any more stops nothing: the draft is read without them.
 */
export function whatStopsFix(facts: FixFacts): string | null {
  const notWaiting = membersNotWaiting(facts);
  if (notWaiting > 0) {
    return `${notWaiting} mahasiswa pada draf sudah punya kelompok pengasuhan atau sudah pindah angkatan. ${FORM_AGAIN}`;
  }
  const notOffered = mentorsNotOffered(facts);
  if (notOffered > 0) return notOfferedWords(notOffered);
  const taken = numbersTaken(facts);
  if (taken > 0) {
    return `${taken} kelompok pada draf memakai nomor yang sudah dipakai kelompok lain yang berlaku. ${FORM_AGAIN}`;
  }
  return null;
}
