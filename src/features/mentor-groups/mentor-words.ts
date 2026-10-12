import type { accounts } from "@/db/schema";
import { shownDay } from "@/ui/day";
import { type GroupCodeParts, groupCode } from "@/ui/group-code";
import { INACTIVE_REASON, type MentorStatus } from "@/ui/mentor-status";

type Account = typeof accounts.$inferSelect;

const BETWEEN = " · ";

/**
 * The gelar and the unit of a mentor as one line. One that is not kept is
 * left out, and the line is empty when neither is.
 */
export function titleAndUnit(mentor: Pick<Account, "title" | "unit">): string {
  const words: string[] = [];
  if (mentor.title) words.push(mentor.title);
  if (mentor.unit) words.push(mentor.unit);
  return words.join(BETWEEN);
}

/** What the words about a mentor's status read. */
export interface MentorSummary {
  status: MentorStatus;
  /** The groups held today. */
  groups: GroupCodeParts[];
  /** How many Aktif students those groups hold. */
  students: number;
  inactiveSince: string | null;
}

/**
 * What the page of a mentor says of their status: the groups held and
 * their students, or that none is held yet, or since when the mentor is
 * Tidak aktif. A day that is not known is left out.
 */
export function standingWords(mentor: MentorSummary): string {
  if (mentor.status === "mentoring") {
    const codes = mentor.groups.map(groupCode).join(", ");
    const students = mentor.students.toLocaleString("id-ID");
    return `Mengasuh ${codes} dengan ${students} mahasiswa.`;
  }
  if (mentor.status === "reserve") {
    return "Pengasuh cadangan, belum memegang kelompok.";
  }
  if (mentor.inactiveSince === null) {
    return `Tidak aktif sebagai pengasuh (${INACTIVE_REASON}).`;
  }
  const since = shownDay(mentor.inactiveSince);
  return `Tidak aktif sebagai pengasuh sejak ${since} (${INACTIVE_REASON}).`;
}

/** The line under a mentor's name: gelar and unit, then the status in words. */
export function mentorLede(
  mentor: MentorSummary & Pick<Account, "title" | "unit">,
): string {
  const who = titleAndUnit(mentor);
  const standing = standingWords(mentor);
  if (who === "") return standing;
  // A gelar such as "M.Si." already ends the sentence with its own dot.
  const end = who.endsWith(".") ? "" : ".";
  return `${who}${end} ${standing}`;
}
