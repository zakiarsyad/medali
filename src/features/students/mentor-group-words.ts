import { shownDay } from "@/ui/day";
import { groupCode } from "@/ui/group-code";
import { mentorLabel } from "@/ui/mentor-label";
import type { ShownMentorGroup } from "./student-mentor-group";

/** Who looks after a student: the mentor of their group, when it has one. */
export function mentorWords(group: ShownMentorGroup | null): string {
  if (group === null || group.mentor === null) return "Belum ditetapkan";
  return mentorLabel(group.mentor);
}

/**
 * The line under the mentor: the group, since when its mentor holds it,
 * and the mentors before when it has had any.
 */
export function mentorGroupWords(group: ShownMentorGroup): string {
  const named = `Kelompok pengasuhan ${groupCode(group)}`;
  const held = group.mentor
    ? `${named}, diasuh sejak ${shownDay(group.mentor.since)}.`
    : `${named}.`;
  if (group.earlierMentors.length === 0) return held;
  return `${held} Sebelumnya: ${group.earlierMentors.join(", ")}.`;
}
