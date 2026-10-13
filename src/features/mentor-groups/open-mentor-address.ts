import type { AccountForAccess } from "@/auth/access";
import type { mentorGroups } from "@/db/schema";
import { mentorAddress } from "./mentor-list-address";
import { maySeeGroup } from "./visible-groups";
import { mentorRowsFor } from "./visible-mentors";

type MentorGroup = typeof mentorGroups.$inferSelect;

/**
 * The address of the page of a group's mentor of today, or null for an
 * account that may not open it. The mentor is then named without a link.
 */
export type MentorAddressOf = (
  mentorId: string,
  group: Pick<MentorGroup, "studyProgramId">,
) => string | null;

/**
 * The address of the page of the mentor who holds a group today, for an
 * account that may open it, or null for one that would be refused there:
 * a screen that names the mentor of a group links to them only with this.
 * The mentor's page shows a mentor to a limited account only while they
 * hold a group in force that the account's mentor rows cover, so the
 * group in view decides. Call it only with a group in force and the
 * mentor of its line without a last day.
 */
export function openMentorAddress(
  account: AccountForAccess,
  mentorId: string,
  group: Pick<MentorGroup, "studyProgramId">,
): string | null {
  const limit = mentorRowsFor(account);
  if (limit === null) return null;
  if (!maySeeGroup(limit, group.studyProgramId)) return null;
  return mentorAddress(mentorId);
}
