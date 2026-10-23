import { and, arrayContains, eq, ne, or, type SQL, sql } from "drizzle-orm";
import { type AccountForAccess, may, rowLimitForAction } from "@/auth/access";
import { visibleTo } from "@/auth/visible-students";
import { counsellingSharings, students } from "@/db/schema";
import { SHARING_RECIPIENTS, type SharingRecipient } from "./sharing-ids";

const NOBODY = sql`false`;

/** Who reads the counselling data published to them, and which sharings they reach. */
export interface SharedReader {
  /** The account, written to the log of readings for each row shown. */
  readerId: string;
  /** The published sharings it reaches, on the sharings joined with their students. */
  reach: SQL;
}

/** The roles of the account that may be named on a sharing and read it. */
export function recipientRolesOf(actor: AccountForAccess): SharingRecipient[] {
  return SHARING_RECIPIENTS.filter(
    (role) =>
      actor.roles.includes(role) && may([role], "view_shared_counselling_data"),
  );
}

/** A sharing that names the role, of a student in that role's own rows. */
function seenAs(actor: AccountForAccess, role: SharingRecipient): SQL {
  const asRole = { ...actor, roles: [role] };
  const rows = visibleTo(
    rowLimitForAction(asRole, "view_shared_counselling_data"),
  );
  return (
    and(arrayContains(counsellingSharings.recipients, [role]), rows) ?? NOBODY
  );
}

/**
 * The published sharings an account may read, as a condition on the
 * sharings joined with their students: one of its roles is named on the
 * sharing and the student is in that role's own rows, never the
 * account's own student. Null for an account without the right, which
 * is then given nothing of a sharing.
 */
export function sharedReachOf(actor: AccountForAccess): SQL | null {
  if (!may(actor.roles, "view_shared_counselling_data")) return null;
  const named = recipientRolesOf(actor).map((role) => seenAs(actor, role));
  const own =
    actor.studentId === null ? undefined : ne(students.id, actor.studentId);
  return (
    and(
      eq(counsellingSharings.status, "published"),
      or(...named) ?? NOBODY,
      own,
    ) ?? NOBODY
  );
}
