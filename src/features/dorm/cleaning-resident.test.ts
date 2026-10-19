// Sample Tahun akademik of this file: 3130 to 3130.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import {
  academicPeriods,
  dormCleaningDuties,
  dormCleaningPlaces,
  dormRoomPlaces,
} from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import {
  addTestProgram,
  addTestRoom,
  addTestStudent,
  placeTestResident,
} from "@/dorms/test-records";
import { changeRoom } from "./change-room";
import { removeCleaningPlace } from "./cleaning-places";
import { readOwnCleaning } from "./cleaning-resident";
import { addTestActor, addTestCompanion, type TestActor } from "./test-records";

const inTestDatabase = withTestDatabase();

/*
 * A period far from those of any other file of checks, so these wait for
 * none of them. Angkatan 3130 is in semester 1 in it, so its Reguler women
 * live in Dana Rakca. Room numbers, NIMs and place names are this file's.
 */
const ODD_3130 = {
  startYear: 3130,
  term: "odd",
  startsOn: "3130-08-01",
  endsOn: "3131-01-31",
} as const;
const TODAY = "3130-10-12";
const DORM = "dana_rakca" as const;

interface Setting {
  staff: TestActor;
  resident: string;
  ownRoom: string;
  otherRoom: string;
  placeId: string;
}

async function setUp(db: Database): Promise<Setting> {
  await db.insert(academicPeriods).values(ODD_3130);
  const program = await addTestProgram(db, "Prodi Uji Bersih Penghuni");
  const resident = await addTestStudent(db, program, {
    nim: "9981030001",
    name: "Penghuni Uji Bersih",
    cohortYear: 3130,
  });
  const roommate = await addTestStudent(db, program, {
    nim: "9981030002",
    name: "Teman Uji Bersih",
    cohortYear: 3130,
  });
  const ownRoom = await addTestRoom(db, { number: "BR101" });
  const otherRoom = await addTestRoom(db, { number: "BR102" });
  await placeTestResident(db, ownRoom, resident);
  await placeTestResident(db, ownRoom, roommate);
  const [place] = await db
    .insert(dormCleaningPlaces)
    .values({ dorm: DORM, name: "Selasar Uji Penghuni" })
    .returning();
  if (!place) throw new Error("The place was not added.");
  const staff = await addTestActor(db, "Pengelola Uji Penghuni", [
    "dorm_manager",
  ]);
  return { staff, resident, ownRoom, otherRoom, placeId: place.id };
}

interface TestDuty {
  day: string;
  roomId: string;
  roomNumber: string;
  placeId?: string;
}

async function addDuties(
  db: Database,
  { staff }: Setting,
  duties: TestDuty[],
): Promise<void> {
  await db
    .insert(dormCleaningDuties)
    .values(
      duties.map((duty) => ({ ...duty, dorm: DORM, createdBy: staff.id })),
    );
}

function studentOf(studentId: string | null, roles: RoleId[] = ["student"]) {
  return { roles, studentId };
}

describe("readOwnCleaning", () => {
  it("shows the resident's room with its residents, its duties from today on and its last duties, newest first", async () => {
    await inTestDatabase(async (db) => {
      const setting = await setUp(db);
      const { ownRoom, placeId } = setting;
      await addDuties(db, setting, [
        { day: "3130-10-11", roomId: ownRoom, roomNumber: "BR101", placeId },
        { day: TODAY, roomId: ownRoom, roomNumber: "BR101" },
        { day: "3130-10-14", roomId: ownRoom, roomNumber: "BR101", placeId },
      ]);

      const own = await readOwnCleaning(db, studentOf(setting.resident), TODAY);

      const unjudged = { status: "scheduled", isRepeat: false, result: null };
      expect(own).toEqual({
        kind: "shown",
        dorm: DORM,
        room: { number: "BR101", residents: 2 },
        score: { plus: 0, minus: 0 },
        scheduled: 2,
        duties: [
          {
            day: "3130-10-14",
            place: "Selasar Uji Penghuni",
            roomNumber: "BR101",
            ...unjudged,
          },
          { day: TODAY, place: null, roomNumber: "BR101", ...unjudged },
          {
            day: "3130-10-11",
            place: "Selasar Uji Penghuni",
            roomNumber: "BR101",
            ...unjudged,
          },
        ],
      });
    });
  });

  it("shows the room's score and each result with its note only once validated, and marks a repeat", async () => {
    await inTestDatabase(async (db) => {
      const setting = await setUp(db);
      const { ownRoom, otherRoom, placeId, staff } = setting;
      const judged = {
        result: "not_met",
        judgeNote: "Lantai belum dipel.",
        judgedBy: staff.id,
        judgedAt: new Date(),
      } as const;
      const validated = {
        status: "validated",
        validatedBy: staff.id,
        validatedAt: new Date(),
      } as const;
      const room = { dorm: DORM, roomNumber: "BR101", createdBy: staff.id };
      const [failed] = await db
        .insert(dormCleaningDuties)
        .values({
          ...room,
          day: "3130-10-09",
          roomId: ownRoom,
          placeId,
          ...judged,
          ...validated,
        })
        .returning();
      await db.insert(dormCleaningDuties).values([
        {
          ...room,
          day: "3130-10-10",
          roomId: ownRoom,
          ...judged,
          result: "met",
          judgeNote: "Rapi.",
          ...validated,
        },
        {
          ...room,
          day: "3130-10-11",
          roomId: ownRoom,
          placeId,
          status: "judged",
          ...judged,
        },
        {
          ...room,
          day: TODAY,
          roomId: ownRoom,
          repeatOf: failed?.id,
        },
        {
          ...room,
          day: "3130-10-08",
          roomId: otherRoom,
          roomNumber: "BR102",
          ...judged,
          ...validated,
        },
      ]);

      const own = await readOwnCleaning(db, studentOf(setting.resident), TODAY);

      expect(own).toMatchObject({
        kind: "shown",
        score: { plus: 1, minus: 1 },
        scheduled: 1,
        duties: [
          { day: TODAY, status: "scheduled", isRepeat: true, result: null },
          { day: "3130-10-11", status: "judged", result: null },
          {
            day: "3130-10-10",
            status: "validated",
            result: { result: "met", note: "Rapi." },
          },
          {
            day: "3130-10-09",
            status: "validated",
            isRepeat: false,
            result: { result: "not_met", note: "Lantai belum dipel." },
          },
        ],
      });
    });
  });

  it("shows the last 20 duties only", async () => {
    await inTestDatabase(async (db) => {
      const setting = await setUp(db);
      const days = Array.from(
        { length: 21 },
        (_, at) => `3130-09-${String(at + 1).padStart(2, "0")}`,
      );
      await addDuties(
        db,
        setting,
        days.map((day) => ({
          day,
          roomId: setting.ownRoom,
          roomNumber: "BR101",
        })),
      );

      const own = await readOwnCleaning(db, studentOf(setting.resident), TODAY);

      if (own.kind !== "shown") throw new Error("The room is not shown.");
      expect(own.duties).toHaveLength(20);
      expect(own.duties[0]?.day).toBe("3130-09-21");
      expect(own.duties.at(-1)?.day).toBe("3130-09-02");
    });
  });

  it("never shows another room's duties", async () => {
    await inTestDatabase(async (db) => {
      const setting = await setUp(db);
      await addDuties(db, setting, [
        { day: TODAY, roomId: setting.otherRoom, roomNumber: "BR102" },
      ]);

      const own = await readOwnCleaning(db, studentOf(setting.resident), TODAY);

      expect(own).toMatchObject({ kind: "shown", scheduled: 0, duties: [] });
    });
  });

  it("shows the duties of the new room to a resident who changed room", async () => {
    await inTestDatabase(async (db) => {
      const setting = await setUp(db);
      await addDuties(db, setting, [
        { day: TODAY, roomId: setting.ownRoom, roomNumber: "BR101" },
        { day: TODAY, roomId: setting.otherRoom, roomNumber: "BR102" },
      ]);
      await db
        .update(dormRoomPlaces)
        .set({ roomId: setting.otherRoom })
        .where(eq(dormRoomPlaces.studentId, setting.resident));

      const own = await readOwnCleaning(db, studentOf(setting.resident), TODAY);

      expect(own).toMatchObject({
        kind: "shown",
        room: { number: "BR102", residents: 1 },
        duties: [{ day: TODAY, place: null, roomNumber: "BR102" }],
      });
    });
  });

  it("leaves out the duties of a removed place from the day it was removed", async () => {
    await inTestDatabase(async (db) => {
      const setting = await setUp(db);
      const { ownRoom, placeId } = setting;
      await addDuties(db, setting, [
        { day: "3130-10-11", roomId: ownRoom, roomNumber: "BR101", placeId },
        { day: TODAY, roomId: ownRoom, roomNumber: "BR101", placeId },
      ]);
      await removeCleaningPlace(db, setting.staff, placeId, TODAY);

      const own = await readOwnCleaning(db, studentOf(setting.resident), TODAY);

      expect(own).toMatchObject({
        kind: "shown",
        scheduled: 0,
        duties: [{ day: "3130-10-11" }],
      });
    });
  });

  it("says when the resident has no room", async () => {
    await inTestDatabase(async (db) => {
      const setting = await setUp(db);
      await db
        .delete(dormRoomPlaces)
        .where(eq(dormRoomPlaces.studentId, setting.resident));

      const own = await readOwnCleaning(db, studentOf(setting.resident), TODAY);

      expect(own).toEqual({ kind: "no_room" });
    });
  });

  it("gives an Aktif kakak pendamping no room by an old place left in the dorm they serve", async () => {
    await inTestDatabase(async (db) => {
      const setting = await setUp(db);
      const program = await addTestProgram(db, "Prodi Uji Bersih Kakak");
      const senior = await addTestStudent(db, program, {
        nim: "9981030003",
        name: "Kakak Uji Bersih",
        cohortYear: 3129,
      });
      await placeTestResident(db, setting.ownRoom, senior);
      await addTestCompanion(db, senior);

      const own = await readOwnCleaning(db, studentOf(senior), TODAY);

      expect(own).toEqual({ kind: "no_room" });
    });
  });

  it("refuses an account without the right, and one with no student", async () => {
    await inTestDatabase(async (db) => {
      const setting = await setUp(db);

      expect(
        await readOwnCleaning(
          db,
          studentOf(setting.resident, ["dorm_manager"]),
          TODAY,
        ),
      ).toEqual({ kind: "refused" });
      expect(await readOwnCleaning(db, studentOf(null), TODAY)).toEqual({
        kind: "refused",
      });
    });
  });

  it("names the room and its own-room duties by the new number after the room is renumbered", async () => {
    await inTestDatabase(async (db) => {
      const setting = await setUp(db);
      await addDuties(db, setting, [
        { day: TODAY, roomId: setting.ownRoom, roomNumber: "BR101" },
      ]);

      const changed = await changeRoom(
        db,
        { roles: ["dorm_manager"] },
        setting.ownRoom,
        { number: "BR111", capacity: "4" },
        TODAY,
      );

      expect(changed.ok).toBe(true);
      const own = await readOwnCleaning(db, studentOf(setting.resident), TODAY);
      expect(own).toMatchObject({
        kind: "shown",
        room: { number: "BR111" },
        duties: [{ day: TODAY, place: null, roomNumber: "BR111" }],
      });
    });
  });
});
