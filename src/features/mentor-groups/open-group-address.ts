import type { AccountForAccess } from "@/auth/access";
import type { mentorGroups } from "@/db/schema";
import { groupAddress } from "./group-list-address";
import { groupRowsFor, maySeeGroup } from "./visible-groups";

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
  const limit = groupRowsFor(account);
  if (limit === null) return null;
  if (!maySeeGroup(limit, group.studyProgramId)) return null;
  return groupAddress(group.id);
}
