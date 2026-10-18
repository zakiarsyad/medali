import { and, eq } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { dormCompanions } from "@/db/schema";
import type { DormId } from "./dorms";

/**
 * The dorm one student serves as an Aktif kakak pendamping, or null: what
 * `dormOf` needs to know of their duty.
 */
export async function readCompanionDorm(
  db: Database,
  studentId: string,
): Promise<DormId | null> {
  const [duty] = await db
    .select({ dorm: dormCompanions.dorm })
    .from(dormCompanions)
    .where(
      and(
        eq(dormCompanions.studentId, studentId),
        eq(dormCompanions.isActive, true),
      ),
    )
    .limit(1);
  return duty?.dorm ?? null;
}
