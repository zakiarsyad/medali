import type { mentorGroupMentors } from "@/db/schema";
import { shownDay } from "@/ui/day";

type MentorLine = Pick<
  typeof mentorGroupMentors.$inferSelect,
  "startsOn" | "endsOn" | "endReason"
>;

/** What a group's row shows where a group without a mentor today has none. */
export const NO_MENTOR = "-";

/**
 * What a group's row says of its mentors, from how many mentor lines the
 * group has had: every line after the first is one replacement. A group
 * without a mentor today says nothing, since "Pengasuh awal" beside an
 * empty mentor would name a mentor who is not there.
 */
export function historyWords(
  mentorLines: number,
  hasMentorToday: boolean,
): string {
  if (!hasMentorToday) return NO_MENTOR;
  if (mentorLines <= 1) return "Pengasuh awal";
  return `${mentorLines - 1} kali diganti`;
}

/** The mentor of today: the line without a last day. Null when none. */
export function currentMentor<Line extends MentorLine>(
  lines: Line[],
): Line | null {
  return lines.find((line) => line.endsOn === null) ?? null;
}

/** What the history says under a mentor: from when, to when, and why. */
export function mentorLineWords(line: MentorLine): string {
  const from = shownDay(line.startsOn);
  if (line.endsOn === null) return `Sejak ${from}. Sedang mengasuh.`;
  const reason = line.endReason ?? "-";
  return `${from} sampai ${shownDay(line.endsOn)}. Alasan: ${reason}.`;
}
