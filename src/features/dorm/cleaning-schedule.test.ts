import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import { dormCleaningDuties, dormCleaningPlaces } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { addTestRoom } from "@/dorms/test-records";
import { removeCleaningPlace, restoreCleaningPlace } from "./cleaning-places";
import {
  countDutiesOn,
  countScheduledRooms,
  readOwnRoomPage,
  readPlaceDutiesOn,
  readPlacesOn,
} from "./cleaning-schedule";
import { addTestActor, type TestActor } from "./test-records";

const inTestDatabase = withTestDatabase();

/*
 * Cipta Bakti, with place names and room numbers used by no other file of
 * checks. No academic period is needed: the rooms with residents are given.
 */
const DORM = "cipta_bakti" as const;
const DORMS = [DORM] as const;
const REMOVED_ON = "2026-10-12";
const BEFORE = "2026-10-11";
const AFTER = "2026-10-13";

interface Setting {
  actor: TestActor;
  placeId: string;
}

async function setUp(db: Database): Promise<Setting> {
  const actor = await addTestActor(db, "Pengelola Uji Jadwal", [
    "bam_household",
  ]);
  const [place] = await db
    .insert(dormCleaningPlaces)
    .values({ dorm: DORM, name: "Aula Uji Jadwal" })
    .returning();
  if (!place) throw new Error("The place was not added.");
  return { actor, placeId: place.id };
}

async function addPlaceDuty(
  db: Database,
  { actor, placeId }: Setting,
  day: string,
): Promise<void> {
  await db.insert(dormCleaningDuties).values({
    day,
    dorm: DORM,
    placeId,
    roomNumber: "BJ101",
    createdBy: actor.id,
  });
}

/** Own-room duties of rooms removed since, so only their numbers are kept. */
async function addOwnRoomDuties(
  db: Database,
  { actor }: Setting,
  numbers: string[],
): Promise<void> {
  await db.insert(dormCleaningDuties).values(
    numbers.map((roomNumber) => ({
      day: BEFORE,
      dorm: DORM,
      roomNumber,
      createdBy: actor.id,
    })),
  );
}

describe("the schedule of a removed place", () => {
  it("shows its duties before the day it was removed, none from that day on, and all again after Urungkan", async () => {
    await inTestDatabase(async (db) => {
      const setting = await setUp(db);
      for (const day of [BEFORE, REMOVED_ON, AFTER]) {
        await addPlaceDuty(db, setting, day);
      }
      await removeCleaningPlace(db, setting.actor, setting.placeId, REMOVED_ON);

      const shown = async (day: string) => ({
        places: (await readPlacesOn(db, DORMS, day)).map((p) => p.name),
        duties: (await readPlaceDutiesOn(db, DORMS, day)).length,
        counted: await countDutiesOn(db, DORMS, day),
      });

      expect(await shown(BEFORE)).toEqual({
        places: ["Aula Uji Jadwal"],
        duties: 1,
        counted: 1,
      });
      expect(await shown(REMOVED_ON)).toEqual({
        places: [],
        duties: 0,
        counted: 0,
      });
      expect(await shown(AFTER)).toEqual({ places: [], duties: 0, counted: 0 });

      await restoreCleaningPlace(db, setting.actor, setting.placeId);
      expect(await shown(AFTER)).toEqual({
        places: ["Aula Uji Jadwal"],
        duties: 1,
        counted: 1,
      });
    });
  });
});

describe("readOwnRoomPage", () => {
  it("lists 20 rooms a page by room number, and the rest on the next page", async () => {
    await inTestDatabase(async (db) => {
      const setting = await setUp(db);
      const numbers = Array.from(
        { length: 21 },
        (_, at) => `BJ${String(21 - at).padStart(3, "0")}`,
      );
      await addOwnRoomDuties(db, setting, numbers);

      const first = await readOwnRoomPage(db, DORM, BEFORE, 1);
      const second = await readOwnRoomPage(db, DORM, BEFORE, 2);
      const beyond = await readOwnRoomPage(db, DORM, BEFORE, 9);

      expect(first.matching).toBe(21);
      expect(first.duties).toHaveLength(20);
      expect(first.duties[0]?.roomNumber).toBe("BJ001");
      expect(second.duties.map((duty) => duty.roomNumber)).toEqual(["BJ021"]);
      expect(beyond.page).toBe(2);
      expect(await countDutiesOn(db, DORMS, BEFORE)).toBe(21);
    });
  });
});

describe("countScheduledRooms", () => {
  it("counts the rooms with residents that clean their own room on the date", async () => {
    await inTestDatabase(async (db) => {
      const { actor } = await setUp(db);
      const lived = await addTestRoom(db, { number: "BJ201", dorm: DORM });
      const other = await addTestRoom(db, { number: "BJ202", dorm: DORM });
      const left = await addTestRoom(db, { number: "BJ203", dorm: DORM });
      const own = { day: BEFORE, dorm: DORM, createdBy: actor.id } as const;
      await db.insert(dormCleaningDuties).values([
        { ...own, roomId: lived, roomNumber: "BJ201" },
        { ...own, roomId: left, roomNumber: "BJ203" },
      ]);
      const rooms = [
        { id: lived, number: "BJ201", residents: 2 },
        { id: other, number: "BJ202", residents: 1 },
      ];

      expect(await countScheduledRooms(db, DORM, BEFORE, rooms)).toBe(1);
      expect(await countScheduledRooms(db, DORM, AFTER, rooms)).toBe(0);
      expect(await countScheduledRooms(db, DORM, BEFORE, [])).toBe(0);
    });
  });
});
