import { asc, eq } from "drizzle-orm";
import { DORM_IDS, type DormId } from "@/dorms/dorms";
import type { Database } from "./connect";
import {
  SAMPLE_CLEANING_PLACES,
  SAMPLE_DUTY_DORMS,
  SAMPLE_NOT_MET_NOTE,
  type SampleDuty,
  sampleCleaningDuties,
} from "./sample-dorm-cleaning";
import {
  dormCleaningChanges,
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

/** Who gives, judges and validates the sample duties. */
interface SampleStaff {
  /** Pengelola Asrama, who gives the duties and validates them. */
  manager: string;
  /** BAM - Kerumahtanggaan, who judges them. */
  judge: string;
}

type DutyRow = typeof dormCleaningDuties.$inferInsert;
type ChangeRow = typeof dormCleaningChanges.$inferInsert;

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

/** A moment of a sample day on campus, such as 10.00. */
function momentOn(day: string, time: string): Date {
  return new Date(`${day}T${time}:00+07:00`);
}

/** What the judgement and the validation of a sample duty write on it. */
function assessmentOf(duty: SampleDuty, staff: SampleStaff): Partial<DutyRow> {
  if (duty.result === null) return {};
  const judged = {
    status: duty.status,
    result: duty.result,
    judgeNote: duty.result === "not_met" ? SAMPLE_NOT_MET_NOTE : "",
    judgedBy: staff.judge,
    judgedAt: momentOn(duty.day, "10:00"),
  };
  if (duty.status !== "validated") return judged;
  return {
    ...judged,
    validatedBy: staff.manager,
    validatedAt: momentOn(duty.day, "15:00"),
  };
}

/** The log lines of a sample duty: its judgement, then its validation. */
function changesOf(dutyId: string, row: DutyRow): ChangeRow[] {
  if (!row.result || !row.judgedBy || !row.judgedAt) return [];
  const judged: ChangeRow = {
    dutyId,
    changedBy: row.judgedBy,
    changedAt: row.judgedAt,
    step: "judged",
    result: row.result,
    note: row.judgeNote ?? "",
  };
  if (!row.validatedBy || !row.validatedAt) return [judged];
  const validated: ChangeRow = {
    dutyId,
    changedBy: row.validatedBy,
    changedAt: row.validatedAt,
    step: "validated",
    result: row.result,
    note: "",
  };
  return [judged, validated];
}

function rowsOf(
  dorm: DormId,
  duties: SampleDuty[],
  ids: { places: Map<string, string>; rooms: Map<string, string> },
  staff: SampleStaff,
): DutyRow[] {
  return duties.map((duty) => {
    const placeId = ids.places.get(`${dorm} ${duty.place}`);
    const roomId = ids.rooms.get(duty.roomNumber);
    if (!placeId || !roomId) {
      throw new Error("A sample cleaning duty names no place or no room.");
    }
    const { day, roomNumber } = duty;
    return {
      day,
      dorm,
      placeId,
      roomId,
      roomNumber,
      createdBy: staff.manager,
      ...assessmentOf(duty, staff),
    };
  });
}

/** What tells the sample duties of a dorm apart: a place has one a day. */
function keyOf(duty: {
  day: string;
  placeId?: string | null | undefined;
}): string {
  return `${duty.day} ${duty.placeId ?? ""}`;
}

/** The id of the added duty that has a key. */
function idOf(added: Map<string, string>, key: string): string {
  const id = added.get(key);
  if (id === undefined) throw new Error("A sample duty was not added.");
  return id;
}

/**
 * Adds the duties of one dorm, then the repeats with the duty each one
 * repeats, then the log of their judgements and validations.
 */
async function addDutiesOf(
  db: Database,
  dorm: DormId,
  today: string,
  places: Map<string, string>,
  staff: SampleStaff,
): Promise<void> {
  const rooms = await roomsWithResidents(db, dorm);
  const roomIds = new Map(rooms.map((room) => [room.number, room.id]));
  const numbers = rooms.map((room) => room.number);
  const duties = sampleCleaningDuties(today, numbers);
  const first = duties.filter((duty) => duty.repeatOf === null);
  if (first.length === 0) return;
  const ids = { places, rooms: roomIds };
  const firstRows = rowsOf(dorm, first, ids, staff);
  const inserted = await db
    .insert(dormCleaningDuties)
    .values(firstRows)
    .returning({
      id: dormCleaningDuties.id,
      day: dormCleaningDuties.day,
      placeId: dormCleaningDuties.placeId,
    });
  const added = new Map(inserted.map((duty) => [keyOf(duty), duty.id]));

  const repeats = duties.filter((duty) => duty.repeatOf !== null);
  const repeatRows = rowsOf(dorm, repeats, ids, staff).map((row, index) => {
    const repeated = duties[repeats[index]?.repeatOf ?? -1];
    if (!repeated) throw new Error("A sample repeat names no duty.");
    const [repeatedRow] = rowsOf(dorm, [repeated], ids, staff);
    if (!repeatedRow) throw new Error("A sample repeat names no duty.");
    return { ...row, repeatOf: idOf(added, keyOf(repeatedRow)) };
  });
  if (repeatRows.length > 0) {
    await db.insert(dormCleaningDuties).values(repeatRows);
  }

  const changes = firstRows.flatMap((row) =>
    changesOf(idOf(added, keyOf(row)), row),
  );
  if (changes.length > 0) await db.insert(dormCleaningChanges).values(changes);
}

/**
 * Adds the sample cleaning places to every dorm and, in Dana Rakca and
 * Cipta Bakti, a week of their duties around today given by the sample
 * Pengelola Asrama to the rooms with residents in turn: those of the past
 * days judged by the sample BAM - Kerumahtanggaan and validated, but one
 * that waits, with the repeat of each one not met. Run after the sample
 * rooms are filled. `today` is today on campus.
 */
export async function addSampleDormCleaning(
  db: Database,
  today: string,
): Promise<void> {
  const staff = {
    manager: await sampleAccount(db, "dorm_manager"),
    judge: await sampleAccount(db, "bam_household"),
  };
  const places = await addSamplePlaces(db);
  for (const dorm of SAMPLE_DUTY_DORMS) {
    await addDutiesOf(db, dorm, today, places, staff);
  }
}
