import { shownDay } from "@/ui/day";
import { groupCode } from "@/ui/group-code";
import { mentorLabel } from "@/ui/mentor-label";
import type { ShownMentorGroup } from "./student-mentor-group";

/** Who looks after a student: the mentor of their group, when it has one. */
export function mentorWords(group: ShownMentorGroup | null): string {
  if (group === null || group.mentor === null) return "Belum ditetapkan";
  return mentorLabel(group.mentor);
}

/** What the line under the mentor says before the group's code. */
export const BEFORE_GROUP_CODE = "Kelompok pengasuhan ";

/**
 * What the line under the mentor says after the group's code: since when
 * its mentor holds it, and the mentors before when it has had any.
 */
export function afterGroupCode(group: ShownMentorGroup): string {
  const held = group.mentor
    ? `, diasuh sejak ${shownDay(group.mentor.since)}.`
    : ".";
  if (group.earlierMentors.length === 0) return held;
  return `${held} Sebelumnya: ${group.earlierMentors.join(", ")}.`;
}

/** The line under the mentor, as plain words. */
export function mentorGroupWords(group: ShownMentorGroup): string {
  return `${BEFORE_GROUP_CODE}${groupCode(group)}${afterGroupCode(group)}`;
}
