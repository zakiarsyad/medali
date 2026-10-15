import type { Database } from "@/db/connect";
import { proofFileKeeping } from "@/db/schema";

/** How many days proof files are kept, or null while nobody has set it. */
export async function readKeepDays(db: Database): Promise<number | null> {
  const [saved] = await db
    .select({ keepDays: proofFileKeeping.keepDays })
    .from(proofFileKeeping);
  return saved?.keepDays ?? null;
}
