import { asc, eq } from "drizzle-orm";
import type { Database } from "@/db/connect";
import {
  dormCleaningChanges,
  dormCleaningDuties,
  dormCleaningPlaces,
} from "@/db/schema";
import { addTestRoom } from "@/dorms/test-records";
import { addTestActor, type TestActor } from "./test-records";

/** Made-up cleaning duties for the checks of judging and validating them. */

export interface TestDuty {
  id: string;
  roomId: string;
  placeId: string;
  manager: TestActor;
}

type DutyValues = Partial<typeof dormCleaningDuties.$inferInsert>;

/**
 * A place of Dana Rakca given to a new room on a day, by a new Pengelola
 * Asrama, with what else is given. Room numbers and place names must be
 * used by no other file of checks.
 */
export async function addTestDuty(
  db: Database,
  names: { room: string; place: string },
  values: DutyValues,
): Promise<TestDuty> {
  const manager = await addTestActor(db, `Pengelola Uji ${names.room}`, [
    "dorm_manager",
  ]);
  const roomId = await addTestRoom(db, { number: names.room });
  const [place] = await db
    .insert(dormCleaningPlaces)
    .values({ dorm: "dana_rakca", name: names.place })
    .returning();
  if (!place) throw new Error("The place was not added.");
  const [duty] = await db
    .insert(dormCleaningDuties)
    .values({
      day: "2026-10-12",
      dorm: "dana_rakca",
      placeId: place.id,
      roomId,
      roomNumber: names.room,
      createdBy: manager.id,
      ...values,
    })
    .returning();
  if (!duty) throw new Error("The duty was not added.");
  return { id: duty.id, roomId, placeId: place.id, manager };
}

/** What a duty judged by `by` holds, by its result. */
export function judgedBy(by: string, result: "met" | "not_met"): DutyValues {
  return {
    status: "judged",
    result,
    judgeNote: result === "not_met" ? "Lantai belum dipel." : "",
    judgedBy: by,
    judgedAt: new Date(),
  };
}

/** A duty as kept. */
export async function dutyById(db: Database, id: string) {
  const [duty] = await db
    .select()
    .from(dormCleaningDuties)
    .where(eq(dormCleaningDuties.id, id));
  if (!duty) throw new Error("There is no such duty.");
  return duty;
}

/** The log lines of a duty, in the order they were written. */
export function changesOfDuty(db: Database, dutyId: string) {
  return db
    .select()
    .from(dormCleaningChanges)
    .where(eq(dormCleaningChanges.dutyId, dutyId))
    .orderBy(asc(dormCleaningChanges.changedAt));
}

/** The repeats of a duty: none or one. */
export function repeatsOfDuty(db: Database, dutyId: string) {
  return db
    .select()
    .from(dormCleaningDuties)
    .where(eq(dormCleaningDuties.repeatOf, dutyId));
}
