import type { AccountForAccess } from "@/auth/access";
import { database } from "@/db/database";
import { readSanctions } from "./read-sanctions";
import { SanctionBadge } from "./sanction-badge";

/**
 * The badge beside the status in one student's detail. Nothing for a
 * student without one, and nothing for an account that may not read the
 * student's discipline records.
 */
export async function StudentSanctionBadge({
  account,
  studentId,
}: {
  account: AccountForAccess;
  studentId: string;
}) {
  const sanctions = await readSanctions(database(), account, [studentId]);
  const sanction = sanctions.get(studentId);
  if (sanction === undefined) return null;
  return <SanctionBadge sanction={sanction} />;
}
