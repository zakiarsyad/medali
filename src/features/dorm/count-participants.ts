import { and, asc, eq, inArray } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { dormRoomPlaces, dormRooms, students } from "@/db/schema";
import { readDormCohorts } from "@/dorms/dorm-cohorts";
import { dormInSql, isPlaceRoomOf } from "@/dorms/resident-condition";
import { dormsOf } from "./activity-audience";
import type { Audience } from "./activity-ids";
import type { Participant } from "./count-view";

/**
 * The residents who take part in an activity for these Peserta on a day,
 * by name: the students who live on that day in a dorm the Peserta
 * covers, by the rule of who lives in which dorm. Each comes with the
 * number of their room in that dorm; a place left behind in another dorm
 * does not count.
 */
export async function readParticipants(
  db: Database,
  audience: Audience,
  day: string,
): Promise<Participant[]> {
  const dormCohorts = (await readDormCohorts(db, day)) ?? [];
  const dorm = dormInSql(dormCohorts);
  const rows = await db
    .select({
      id: students.id,
      name: students.name,
      nim: students.nim,
      dorm,
      room: dormRooms.number,
    })
    .from(students)
    .leftJoin(dormRoomPlaces, eq(dormRoomPlaces.studentId, students.id))
    .leftJoin(
      dormRooms,
      and(eq(dormRooms.id, dormRoomPlaces.roomId), isPlaceRoomOf(dorm)),
    )
    .where(inArray(dorm, [...dormsOf(audience)]))
    .orderBy(asc(students.name), asc(students.nim));

  const participants: Participant[] = [];
  for (const { dorm: livesIn, ...row } of rows) {
    if (livesIn !== null) participants.push({ ...row, dorm: livesIn });
  }
  return participants;
}
