import { like } from "drizzle-orm";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import type { RoleId } from "@/auth/role-ids";
import {
  academicPeriods,
  dormCleaningDuties,
  dormCleaningPlaces,
  dormRoomPlaces,
  dormRooms,
  students,
  studyPrograms,
} from "@/db/schema";
import { type Save, withOwnTestDatabase } from "@/db/test-database-at-once";
import {
  addTestProgram,
  addTestRoom,
  addTestStudent,
  DAY,
  ODD_2026,
  placeTestResident,
} from "@/dorms/test-records";
import type { Parsed } from "@/parsed";
import { assignOwnRooms, assignPlaceDuty } from "./cleaning-duties";
import { readCleaningPlaces } from "./cleaning-place-list";
import { addCleaningPlace } from "./cleaning-places";
import { addTestActor, type TestActor } from "./test-records";

const own = withOwnTestDatabase("cleaning");
const MANAGER = { roles: ["dorm_manager"] as RoleId[] };
const BAM = { roles: ["bam_household"] as RoleId[] };
const DORM = "dana_rakca";
const PROGRAM = "Prodi Uji Bersih Serentak";
const TAKEN = {
  ok: false,
  error:
    "Tempat ini sudah ditugaskan ke kamar lain pada tanggal ini. Muat ulang halaman.",
};

let staff: TestActor;

beforeAll(async () => {
  await own.db.insert(academicPeriods).values(ODD_2026);
  staff = await addTestActor(own.db, "Pengelola Uji Serentak", [
    "dorm_manager",
  ]);
});

afterEach(async () => {
  await own.db.delete(dormCleaningDuties);
  await own.db.delete(dormCleaningPlaces);
  await own.db.delete(dormRoomPlaces);
  await own.db.delete(dormRooms);
  await own.db.delete(students);
  await own.db.delete(studyPrograms).where(like(studyPrograms.name, PROGRAM));
});

type CleaningSave = Save<Parsed<string>>;

function addPlace(actor: { roles: RoleId[] }, name: string): CleaningSave {
  return (db) => addCleaningPlace(db, actor, { name, dorm: DORM });
}

/** Two rooms of the dorm, each with one resident, and one place. */
async function addRoomsAndPlace() {
  const program = await addTestProgram(own.db, PROGRAM);
  const rooms: string[] = [];
  for (const place of [1, 2]) {
    const roomId = await addTestRoom(own.db, { number: `BS10${place}` });
    const studentId = await addTestStudent(own.db, program, {
      nim: `998104000${place}`,
      name: `Penghuni Uji ${place}`,
    });
    await placeTestResident(own.db, roomId, studentId);
    rooms.push(roomId);
  }
  const [place] = await own.db
    .insert(dormCleaningPlaces)
    .values({ dorm: DORM, name: "Kamar Mandi" })
    .returning();
  if (!place) throw new Error("The place was not added.");
  return { rooms, placeId: place.id };
}

function assign(placeId: string, roomId: string): CleaningSave {
  return (db) => assignPlaceDuty(db, staff, { placeId, roomId, day: DAY }, DAY);
}

function assignAllOwn(): CleaningSave {
  return (db) => assignOwnRooms(db, staff, { dorm: DORM, day: DAY }, DAY);
}

async function dutiesKept() {
  return own.db.select().from(dormCleaningDuties);
}

describe("two staff adding a place of the same name at the same moment", () => {
  it("saves one, and tells the other the name is used", async () => {
    const both = await own.atOnce(
      addPlace(MANAGER, "Musala"),
      addPlace(BAM, "musala "),
    );

    expect(both.sooner).toEqual({ ok: true, value: "Musala" });
    expect(both.later).toEqual({
      ok: false,
      error: "Tempat dengan nama ini sudah ada di asrama ini.",
    });
    const places = await readCleaningPlaces(own.db, [DORM]);
    expect(places.map((place) => place.name)).toEqual(["Musala"]);
  });
});

describe("two staff giving one place to two rooms on one date at the same moment", () => {
  it("saves one duty, and tells the other to read the page again", async () => {
    const { rooms, placeId } = await addRoomsAndPlace();
    const [one = "", two = ""] = rooms;

    const both = await own.atOnce(assign(placeId, one), assign(placeId, two));

    expect(both.sooner).toEqual({ ok: true, value: "Kamar ditugaskan." });
    expect(both.later).toEqual(TAKEN);
    const kept = await dutiesKept();
    expect(kept.map((duty) => duty.roomId)).toEqual([one]);
  });
});

describe("Tugaskan pressed twice", () => {
  it("saves one duty", async () => {
    const { rooms, placeId } = await addRoomsAndPlace();
    const [one = ""] = rooms;

    const both = await own.atOnce(assign(placeId, one), assign(placeId, one));

    expect(both.sooner.ok).toBe(true);
    expect(both.later).toEqual(TAKEN);
    expect(await dutiesKept()).toHaveLength(1);
  });
});

describe("two staff giving every room its own room at the same moment", () => {
  it("gives each room one duty, and tells the other every room is scheduled", async () => {
    await addRoomsAndPlace();

    const both = await own.atOnce(assignAllOwn(), assignAllOwn());

    expect(both.sooner).toEqual({
      ok: true,
      value: "2 tugas kamar dijadwalkan.",
    });
    expect(both.later).toEqual({
      ok: true,
      value: "Semua kamar sudah dijadwalkan.",
    });
    expect(await dutiesKept()).toHaveLength(2);
  });
});
