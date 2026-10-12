import { inArray } from "drizzle-orm";
import { studentSemester } from "@/academic-periods/student-semester";
import { DORM_IDS, type DormId } from "@/dorms/dorms";
import { dormOf } from "@/dorms/resident-rule";
import type { Database } from "./connect";
import type { SamplePeriod } from "./sample-data";
import {
  SAMPLE_COMPANIONS,
  SAMPLE_ROOMS,
  samplePlaces,
  sampleRoomKey,
} from "./sample-dorms";
import { dormCompanions, dormRoomPlaces, dormRooms, students } from "./schema";

type NewPlace = typeof dormRoomPlaces.$inferInsert;

/** The id of each resident of one dorm, by NIM. */
type Residents = Map<string, string>;

async function addSampleRooms(db: Database): Promise<Map<string, string>> {
  const rooms = DORM_IDS.flatMap((dorm) =>
    SAMPLE_ROOMS.map(({ floor, number, capacity }) => ({
      dorm,
      floor,
      number,
      capacity,
    })),
  );
  const added = await db.insert(dormRooms).values(rooms).returning();
  return new Map(
    added.map((room) => [sampleRoomKey(room.dorm, room.number), room.id]),
  );
}

async function residentsByDorm(
  db: Database,
  period: SamplePeriod,
): Promise<Map<DormId, Residents>> {
  const found = new Map<DormId, Residents>();
  for (const student of await db.select().from(students)) {
    const semester = studentSemester(student.cohortYear, period);
    const dorm = dormOf(student, semester);
    if (dorm === null) continue;
    const residents = found.get(dorm) ?? new Map<string, string>();
    residents.set(student.nim, student.id);
    found.set(dorm, residents);
  }
  return found;
}

function placesIn(
  dorm: DormId,
  residents: Residents,
  roomIds: Map<string, string>,
): NewPlace[] {
  return samplePlaces([...residents.keys()]).map((place) => {
    const roomId = roomIds.get(sampleRoomKey(dorm, place.roomNumber));
    const studentId = residents.get(place.nim);
    if (!roomId || !studentId) {
      throw new Error("A sample room place names no room or no student.");
    }
    return { roomId, studentId };
  });
}

async function addSampleCompanions(db: Database): Promise<void> {
  const nims = SAMPLE_COMPANIONS.map((companion) => companion.nim);
  const found = await db
    .select({ id: students.id, nim: students.nim })
    .from(students)
    .where(inArray(students.nim, nims));
  const idByNim = new Map(found.map((student) => [student.nim, student.id]));
  const companions = SAMPLE_COMPANIONS.map(({ nim, ...companion }) => {
    const studentId = idByNim.get(nim);
    if (!studentId)
      throw new Error("A sample kakak pendamping names no student.");
    return { ...companion, studentId };
  });
  await db.insert(dormCompanions).values(companions);
}

/**
 * Adds the sample rooms to each of the four dorms, puts some of the
 * residents of the running sample period into them, and names the sample
 * kakak pendamping.
 */
export async function addSampleDorms(
  db: Database,
  period: SamplePeriod,
): Promise<void> {
  const roomIds = await addSampleRooms(db);
  const residents = await residentsByDorm(db, period);
  const places = DORM_IDS.flatMap((dorm) =>
    placesIn(dorm, residents.get(dorm) ?? new Map<string, string>(), roomIds),
  );
  if (places.length > 0) await db.insert(dormRoomPlaces).values(places);
  await addSampleCompanions(db);
}
