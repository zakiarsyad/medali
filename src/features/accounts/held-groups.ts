import { and, eq, isNull } from "drizzle-orm";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { mentorGroupMentors, mentorGroups } from "@/db/schema";

const REPLACE_FIRST =
  "Ganti pengasuh kelompok tersebut lebih dulu, lalu coba lagi.";

export const REMOVAL_REFUSED_FOR_GROUP = `Akun ini masih menjadi pengasuh sebuah kelompok pengasuhan, sehingga tidak bisa dihapus. ${REPLACE_FIRST}`;

export const ROLE_REFUSED_FOR_GROUP = `Akun ini masih menjadi pengasuh sebuah kelompok pengasuhan, sehingga peran Pengasuh tidak bisa dicabut. ${REPLACE_FIRST}`;

/** Whether a change of roles takes the Pengasuh role from an account. */
export function takesMentorRole(before: RoleId[], after: RoleId[]): boolean {
  return before.includes("mentor") && !after.includes("mentor");
}

/**
 * Whether an account is the mentor of today of any group. A group held
 * before does not count: its mentor line has ended. Neither does a group
 * that is ended itself, which nobody can replace the mentor of.
 */
export async function holdsGroupToday(
  db: Database,
  accountId: string,
): Promise<boolean> {
  const [held] = await db
    .select({ id: mentorGroupMentors.id })
    .from(mentorGroupMentors)
    .innerJoin(mentorGroups, eq(mentorGroups.id, mentorGroupMentors.groupId))
    .where(
      and(
        eq(mentorGroupMentors.mentorId, accountId),
        isNull(mentorGroupMentors.endsOn),
        isNull(mentorGroups.endedAt),
      ),
    )
    .limit(1);
  return held !== undefined;
}
