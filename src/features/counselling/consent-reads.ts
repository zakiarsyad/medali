import { eq } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { versionOf } from "@/db/row-version";
import { accounts, counsellingConsents } from "@/db/schema";
import type { ConsentView } from "./consent-view";

/** The current consent of a student, or null when they were never asked. */
export async function readConsentOf(
  db: Database,
  studentId: string,
): Promise<ConsentView | null> {
  const [found] = await db
    .select({
      status: counsellingConsents.status,
      way: counsellingConsents.way,
      changedAt: counsellingConsents.changedAt,
      changedByName: accounts.name,
      changedByStudent: accounts.studentId,
    })
    .from(counsellingConsents)
    .innerJoin(accounts, eq(accounts.id, counsellingConsents.changedBy))
    .where(eq(counsellingConsents.studentId, studentId));
  if (!found) return null;
  const isOwnAnswer = found.changedByStudent === studentId;
  return {
    status: found.status,
    way: found.way,
    changedAt: found.changedAt,
    counsellorName: isOwnAnswer ? null : found.changedByName,
    version: versionOf(found.changedAt),
  };
}
