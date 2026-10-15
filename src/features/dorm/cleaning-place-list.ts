import { and, asc, inArray, isNull, sql } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { dormCleaningPlaces } from "@/db/schema";
import type { DormId } from "@/dorms/dorms";

/** A cleaning place as the screen lists it. */
export interface CleaningPlace {
  id: string;
  dorm: DormId;
  name: string;
}

/** The places of some dorms that are not removed, by dorm and by name. */
export async function readCleaningPlaces(
  db: Database,
  dorms: readonly DormId[],
): Promise<CleaningPlace[]> {
  return db
    .select({
      id: dormCleaningPlaces.id,
      dorm: dormCleaningPlaces.dorm,
      name: dormCleaningPlaces.name,
    })
    .from(dormCleaningPlaces)
    .where(
      and(
        inArray(dormCleaningPlaces.dorm, [...dorms]),
        isNull(dormCleaningPlaces.deletedAt),
      ),
    )
    .orderBy(
      asc(dormCleaningPlaces.dorm),
      asc(sql`lower(${dormCleaningPlaces.name})`),
    );
}
