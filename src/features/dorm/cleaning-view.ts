import type { Database } from "@/db/connect";
import type { DormId } from "@/dorms/dorms";
import { type CleaningParams, shownDorms } from "./cleaning-address";
import { type CleaningPlace, readCleaningPlaces } from "./cleaning-place-list";
import { type OccupiedRoom, readOccupiedRoomsOf } from "./cleaning-rooms";
import {
  countDutiesOn,
  countScheduledRooms,
  type OwnRoomPage,
  readOwnRoomPage,
  readPlaceDutiesOn,
  readPlacesOn,
  type ScheduledDuty,
} from "./cleaning-schedule";
import {
  countWaiting,
  type RankingPage,
  readRanking,
  type WaitingCounts,
} from "./cleaning-scores";

/** What Jadwal pembersihan shows of one dorm on the date picked. */
export interface DormSchedule {
  dorm: DormId;
  /** The places that show on the date. */
  places: CleaningPlace[];
  /** The rooms with residents today, which can be given a duty. */
  rooms: OccupiedRoom[];
  ownRooms: OwnRoomPage;
  /** How many of those rooms clean their own room on the date. */
  scheduledRooms: number;
}

/** What the Pembersihan asrama screen shows to staff. */
export interface CleaningView {
  /** The places of the dorms shown that are not removed. */
  places: CleaningPlace[];
  /** The duties of the places on the date that show. */
  placeDuties: ScheduledDuty[];
  schedules: DormSchedule[];
  /** How many duties show on the date, of places and of own rooms. */
  dutiesOnDay: number;
  /** "Menunggu validasi" and "Pembersihan ulang", of every date. */
  waiting: WaitingCounts;
  ranking: RankingPage;
}

async function readDormSchedule(
  db: Database,
  dorm: DormId,
  params: CleaningParams,
  rooms: OccupiedRoom[],
  placesOnDay: CleaningPlace[],
): Promise<DormSchedule> {
  const [ownRooms, scheduledRooms] = await Promise.all([
    readOwnRoomPage(db, dorm, params.day, params.page),
    countScheduledRooms(db, dorm, params.day, rooms),
  ]);
  const places = placesOnDay.filter((place) => place.dorm === dorm);
  return { dorm, places, rooms, ownRooms, scheduledRooms };
}

/**
 * Reads what the screen shows: one date, and one page of the rooms that
 * clean their own room. It only reads. The rooms with residents are those
 * of `today`, the day on campus.
 */
export async function loadCleaning(
  db: Database,
  params: CleaningParams,
  today: string,
): Promise<CleaningView> {
  const dorms = shownDorms(params);
  const [
    places,
    roomsByDorm,
    placesOnDay,
    placeDuties,
    dutiesOnDay,
    waiting,
    ranking,
  ] = await Promise.all([
    readCleaningPlaces(db, dorms),
    readOccupiedRoomsOf(db, dorms, today),
    readPlacesOn(db, dorms, params.day),
    readPlaceDutiesOn(db, dorms, params.day),
    countDutiesOn(db, dorms, params.day),
    countWaiting(db, dorms),
    readRanking(db, dorms, params.scorePage),
  ]);
  const schedules = await Promise.all(
    dorms.map((dorm) =>
      readDormSchedule(
        db,
        dorm,
        params,
        roomsByDorm.get(dorm) ?? [],
        placesOnDay,
      ),
    ),
  );
  return { places, placeDuties, schedules, dutiesOnDay, waiting, ranking };
}
