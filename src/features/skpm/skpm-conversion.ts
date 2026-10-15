import { desc, eq } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { accounts, skpmConversions } from "@/db/schema";
import { STARTING_POINTS_FOR_100 } from "./skpm-ids";

/** "Poin untuk nilai 100" as it is now, with who set it last and when. */
export interface SkpmConversion {
  pointsForHundred: number;
  /** The last setting, or null while the number is the starting one. */
  set: { at: Date; by: string } | null;
}

/** The latest setting of "Poin untuk nilai 100", or the starting number. */
export async function readConversion(db: Database): Promise<SkpmConversion> {
  const [latest] = await db
    .select({
      pointsForHundred: skpmConversions.pointsForHundred,
      at: skpmConversions.setAt,
      by: accounts.name,
    })
    .from(skpmConversions)
    .innerJoin(accounts, eq(accounts.id, skpmConversions.setBy))
    .orderBy(desc(skpmConversions.setAt), desc(skpmConversions.id))
    .limit(1);
  if (!latest) return { pointsForHundred: STARTING_POINTS_FOR_100, set: null };
  const { pointsForHundred, at, by } = latest;
  return { pointsForHundred, set: { at, by } };
}
