import { type AccountForAccess, may, rowLimitFor } from "@/auth/access";
import type { mentorGroups } from "@/db/schema";
import { groupAddress } from "./group-list-address";
import { maySeeGroup } from "./visible-groups";

type MentorGroup = typeof mentorGroups.$inferSelect;

/**
 * The address of a group's page for an account that may open it, or null
 * for one that would be refused there: a screen outside Pengasuh that
 * names a group links to it only with this.
 */
export function openGroupAddress(
  account: AccountForAccess,
  group: Pick<MentorGroup, "id" | "studyProgramId">,
): string | null {
  if (!may(account.roles, "view_mentor_groups")) return null;
  if (!maySeeGroup(rowLimitFor(account), group.studyProgramId)) return null;
  return groupAddress(group.id);
}
