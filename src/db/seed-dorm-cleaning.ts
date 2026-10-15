import { asc, eq } from "drizzle-orm";
import { DORM_IDS, type DormId } from "@/dorms/dorms";
import type { Database } from "./connect";
import {
  SAMPLE_CLEANING_PLACES,
  SAMPLE_DUTY_DORMS,
  sampleCleaningDuties,
} from "./sample-dorm-cleaning";
import {
  dormCleaningDuties,
  dormCleaningPlaces,
  dormRoomPlaces,
  dormRooms,
} from "./schema";
import { sampleAccount } from "./seed-dorm-leaves";

interface SampleRoom {
  id: string;
  number: string;
}

/** The rooms of a dorm that have residents, by number. */
async function roomsWithResidents(
  db: Database,
  dorm: DormId,
): Promise<SampleRoom[]> {
  return db
    .selectDistinct({ id: dormRooms.id, number: dormRooms.number })
    .from(dormRooms)
    .innerJoin(dormRoomPlaces, eq(dormRoomPlaces.roomId, dormRooms.id))
    .where(eq(dormRooms.dorm, dorm))
    .orderBy(asc(dormRooms.number));
}

/** The id of each sample place of every dorm, by dorm and name. */
async function addSamplePlaces(db: Database): Promise<Map<string, string>> {
  const places = DORM_IDS.flatMap((dorm) =>
    SAMPLE_CLEANING_PLACES.map((name) => ({ dorm, name })),
  );
  const added = await db.insert(dormCleaningPlaces).values(places).returning();
  return new Map(
    added.map((place) => [`${place.dorm} ${place.name}`, place.id]),
  );
}

async function dutiesOf(
  db: Database,
  dorm: DormId,
  today: string,
  placeIds: Map<string, string>,
  createdBy: string,
): Promise<(typeof dormCleaningDuties.$inferInsert)[]> {
  const rooms = await roomsWithResidents(db, dorm);
  const roomIds = new Map(rooms.map((room) => [room.number, room.id]));
  const numbers = rooms.map((room) => room.number);
  return sampleCleaningDuties(today, numbers).map((duty) => {
    const placeId = placeIds.get(`${dorm} ${duty.place}`);
    const roomId = roomIds.get(duty.roomNumber);
    if (!placeId || !roomId) {
      throw new Error("A sample cleaning duty names no place or no room.");
    }
    const { day, roomNumber } = duty;
    return { day, dorm, placeId, roomId, roomNumber, createdBy };
  });
}

/**
 * Adds the sample cleaning places to every dorm and, in Dana Rakca and
 * Cipta Bakti, a week of their duties around today given by the sample
 * Pengelola Asrama to the rooms with residents in turn. Run after the
 * sample rooms are filled. `today` is today on campus.
 */
export async function addSampleDormCleaning(
  db: Database,
  today: string,
): Promise<void> {
  const createdBy = await sampleAccount(db, "dorm_manager");
  const placeIds = await addSamplePlaces(db);
  for (const dorm of SAMPLE_DUTY_DORMS) {
    const duties = await dutiesOf(db, dorm, today, placeIds, createdBy);
    if (duties.length > 0) await db.insert(dormCleaningDuties).values(duties);
  }
}
