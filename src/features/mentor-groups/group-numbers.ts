import { and, count, eq, sql } from "drizzle-orm";
import type { RowLimit } from "@/auth/access";
import type { Database } from "@/db/connect";
import { mentorGroupMembers, mentorGroups, students } from "@/db/schema";
import { GROUP_MAX, GROUP_MIN } from "@/ui/group-size";
import { COUNTED_MEMBER } from "./member-conditions";
import { groupsVisibleTo } from "./visible-groups";

/** The numbers above the Kelompok pengasuhan list. */
export interface GroupNumbers {
  groups: number;
  /** The Aktif students those groups hold together. */
  members: number;
  /** How many of the groups hold a usual number of members. */
  usualSize: number;
}

/**
 * The numbers of the groups an account may see, whatever the list is
 * filtered by. One read: the size of each group, then their sums.
 */
export async function readGroupNumbers(
  db: Database,
  limit: RowLimit,
): Promise<GroupNumbers> {
  const sizes = db
    .select({ size: count(students.id).as("size") })
    .from(mentorGroups)
    .leftJoin(
      mentorGroupMembers,
      eq(mentorGroupMembers.groupId, mentorGroups.id),
    )
    .leftJoin(
      students,
      and(eq(students.id, mentorGroupMembers.studentId), COUNTED_MEMBER),
    )
    .where(groupsVisibleTo(limit))
    .groupBy(mentorGroups.id)
    .as("sizes");
  const [numbers] = await db
    .select({
      groups: count(),
      members: sql`coalesce(sum(${sizes.size}), 0)`.mapWith(Number),
      usualSize:
        sql`count(*) filter (where ${sizes.size} between ${GROUP_MIN} and ${GROUP_MAX})`.mapWith(
          Number,
        ),
    })
    .from(sizes);
  return numbers ?? { groups: 0, members: 0, usualSize: 0 };
}
