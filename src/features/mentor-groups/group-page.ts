import type { SQL } from "drizzle-orm";
import { campusDay } from "@/academic-periods/campus-day";
import type { RowLimit } from "@/auth/access";
import type { Database } from "@/db/connect";
import { type GroupDetail, readGroup } from "./group-detail";
import { countRecentNotes } from "./recent-notes";

export type GroupPageAnswer =
  | { kind: "not_found" }
  | { kind: "refused" }
  | {
      kind: "found";
      group: GroupDetail;
      /** "Catatan pengasuhan 90 hari": the notes about the members lately. */
      recentNotes: number;
    };

/**
 * What the page of one group shows to an account with this row limit: the
 * group, and how many notes were written about its members lately. Every
 * account that may open the group gets that number, whatever notes it may
 * read: it is the count of the group, not a note. The notes are counted
 * only once the group is found and may be opened, so a group that is
 * refused or does not exist gives no number.
 */
export async function readGroupPage(
  db: Database,
  limit: RowLimit,
  groupId: string,
  detailVisible: SQL | null,
  day: string = campusDay(),
): Promise<GroupPageAnswer> {
  const answer = await readGroup(db, limit, groupId, detailVisible);
  if (answer.kind !== "found") return answer;
  const recentNotes = await countRecentNotes(db, answer.group.id, day);
  return { ...answer, recentNotes };
}
