import type { accounts, mentorGroupMentors } from "@/db/schema";
import { shownDay } from "@/ui/day";

type MentorLine = Pick<
  typeof mentorGroupMentors.$inferSelect,
  "startsOn" | "endsOn" | "endReason"
>;

/**
 * What a group's row says of its mentors, from how many mentor lines the
 * group has had: every line after the first is one replacement.
 */
export function historyWords(mentorLines: number): string {
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

/** A mentor's name, with the gelar after it when there is one. */
export function mentorLabel(
  mentor: Pick<typeof accounts.$inferSelect, "name" | "title">,
): string {
  return mentor.title ? `${mentor.name}, ${mentor.title}` : mentor.name;
}
