import { and, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import { academicPeriods, students } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import type { DormId } from "@/dorms/dorms";
import type { RoomsParams } from "./rooms-address";
import { loadRooms, type RoomsView } from "./rooms-view";
import { freeStalePlacesIn, freeStalePlacesOf } from "./stale-places";
import {
  addTestProgram,
  addTestRoom,
  addTestStudent,
  EVERYONE,
  placeTestResident,
  residentsOfRoom,
} from "./test-records";

const inTestDatabase = withTestDatabase();

/*
 * Periods far from those of any other file of checks, so these wait for
 * none of them. In the first one angkatan 2080 is in semester 1, in the
 * second one in semester 3.
 */
const ODD_2080 = {
  startYear: 2080,
  term: "odd",
  startsOn: "2080-08-01",
  endsOn: "2081-01-31",
} as const;
const ODD_2081 = {
  startYear: 2081,
  term: "odd",
  startsOn: "2081-08-01",
  endsOn: "2082-01-31",
} as const;
const DAY = "2080-10-12";
const A_YEAR_LATER = "2081-10-12";

interface Placed {
  program: number;
  roomId: string;
  studentId: string;
}

/** A Reguler woman of semester 1 with a place in a room of Dana Rakca. */
async function addPlacedResident(db: Database): Promise<Placed> {
  await db.insert(academicPeriods).values(ODD_2080);
  const program = await addTestProgram(db, "Prodi Uji Asrama S");
  const studentId = await addTestStudent(db, program, {
    nim: "9923800001",
    name: "Penghuni Uji",
    cohortYear: 2080,
  });
  const roomId = await addTestRoom(db, { number: "S101", capacity: 1 });
  await placeTestResident(db, roomId, studentId);
  return { program, roomId, studentId };
}

function open(dorm: DormId): RoomsParams {
  return { dorm, floor: 1, query: "" };
}

/** What the Ploting kamar screen of Dana Rakca shows on a day. */
function load(db: Database, day = DAY): Promise<RoomsView> {
  return loadRooms(db, open("dana_rakca"), EVERYONE, day);
}

function takenIn(view: RoomsView, roomId: string): number {
  return view.rooms.find((room) => room.id === roomId)?.taken ?? -1;
}

function shownIds(view: RoomsView): string[] {
  return view.residents.map((resident) => resident.id);
}

async function change(
  db: Database,
  studentId: string,
  to: Partial<typeof students.$inferInsert>,
): Promise<void> {
  await db.update(students).set(to).where(eq(students.id, studentId));
}

describe("a load of Ploting kamar", () => {
  it("shows a resident in their room", async () => {
    await inTestDatabase(async (db) => {
      const { roomId, studentId } = await addPlacedResident(db);

      const view = await load(db);

      expect(view.periodRuns).toBe(true);
      expect(takenIn(view, roomId)).toBe(1);
      expect(shownIds(view)).toEqual([studentId]);
      expect(view.counts).toEqual({ residents: 1, placed: 1 });
      expect(view.unplaced.matching).toBe(0);
    });
  });

  it.each(["on_leave", "inactive"] as const)(
    "shows the place of a resident whose status became %s as free, and deletes nothing",
    async (status) => {
      await inTestDatabase(async (db) => {
        const { roomId, studentId } = await addPlacedResident(db);
        await change(db, studentId, { status });

        const view = await load(db);

        expect(takenIn(view, roomId)).toBe(0);
        expect(shownIds(view)).toEqual([]);
        expect(view.counts).toEqual({ residents: 0, placed: 0 });
        expect(await residentsOfRoom(db, roomId)).toEqual([studentId]);
      });
    },
  );

  it("shows the place of a Reguler resident who reaches semester 3 as free", async () => {
    await inTestDatabase(async (db) => {
      const { roomId, studentId } = await addPlacedResident(db);
      await db.insert(academicPeriods).values(ODD_2081);

      const view = await load(db, A_YEAR_LATER);

      expect(takenIn(view, roomId)).toBe(0);
      expect(shownIds(view)).toEqual([]);
      expect(view.counts).toEqual({ residents: 0, placed: 0 });
      expect(await residentsOfRoom(db, roomId)).toEqual([studentId]);
    });
  });

  it("keeps showing a Pembibitan resident who reaches semester 3", async () => {
    await inTestDatabase(async (db) => {
      await db.insert(academicPeriods).values([ODD_2080, ODD_2081]);
      const program = await addTestProgram(db, "Prodi Uji Asrama S");
      const studentId = await addTestStudent(db, program, {
        nim: "9923800001",
        name: "Penghuni Uji",
        cohortYear: 2080,
        isSeedling: true,
      });
      const roomId = await addTestRoom(db, {
        number: "S101",
        dorm: "wismantara_putri",
      });
      await placeTestResident(db, roomId, studentId);

      const view = await loadRooms(
        db,
        open("wismantara_putri"),
        EVERYONE,
        A_YEAR_LATER,
      );

      expect(takenIn(view, roomId)).toBe(1);
      expect(shownIds(view)).toEqual([studentId]);
    });
  });

  it("shows a resident who now lives in another dorm as without a room there", async () => {
    await inTestDatabase(async (db) => {
      const { roomId, studentId } = await addPlacedResident(db);
      await change(db, studentId, { isInternational: true });

      const old = await load(db);
      const now = await loadRooms(db, open("wismantara_putri"), EVERYONE, DAY);

      expect(takenIn(old, roomId)).toBe(0);
      expect(shownIds(old)).toEqual([]);
      expect(now.counts).toEqual({ residents: 1, placed: 0 });
      expect(now.unplaced.shown.map((one) => one.id)).toEqual([studentId]);
      expect(await residentsOfRoom(db, roomId)).toEqual([studentId]);
    });
  });

  it("shows the place of a removed student as free", async () => {
    await inTestDatabase(async (db) => {
      const { roomId, studentId } = await addPlacedResident(db);
      await change(db, studentId, { deletedAt: new Date() });

      const view = await load(db);

      expect(takenIn(view, roomId)).toBe(0);
      expect(shownIds(view)).toEqual([]);
      expect(await residentsOfRoom(db, roomId)).toEqual([studentId]);
    });
  });

  it("deletes nothing when no academic period runs", async () => {
    await inTestDatabase(async (db) => {
      const { roomId, studentId } = await addPlacedResident(db);
      await db.delete(academicPeriods);

      const view = await load(db);

      expect(view.periodRuns).toBe(false);
      expect(takenIn(view, roomId)).toBe(0);
      expect(shownIds(view)).toEqual([]);
      expect(await residentsOfRoom(db, roomId)).toEqual([studentId]);
    });
  });

  it("counts for a Ketua Program Studi the residents of other programs, without those who left", async () => {
    await inTestDatabase(async (db) => {
      const { program, roomId, studentId } = await addPlacedResident(db);
      const other = await addTestProgram(db, "Prodi Uji Asrama S Lain");
      const more = { cohortYear: 2080, name: "Penghuni Uji Lain" };
      const stays = await addTestStudent(db, other, {
        ...more,
        nim: "9923800002",
      });
      const left = await addTestStudent(db, other, {
        ...more,
        nim: "9923800003",
        status: "on_leave",
      });
      await placeTestResident(db, roomId, stays);
      await placeTestResident(db, roomId, left);
      const ownProgram = and(EVERYONE, eq(students.studyProgramId, program));
      if (!ownProgram) throw new Error("The condition was not made.");

      const view = await loadRooms(db, open("dana_rakca"), ownProgram, DAY);

      expect(shownIds(view)).toEqual([studentId]);
      expect(takenIn(view, roomId) - view.residents.length).toBe(1);
      expect(view.counts).toEqual({ residents: 1, placed: 1 });
      expect(await residentsOfRoom(db, roomId)).toHaveLength(3);
    });
  });
});

describe("freeStalePlacesIn", () => {
  it("deletes the stale places of the room, and leaves every other place", async () => {
    await inTestDatabase(async (db) => {
      const { program, roomId, studentId } = await addPlacedResident(db);
      const more = { cohortYear: 2080, status: "on_leave" as const };
      const left = await addTestStudent(db, program, {
        ...more,
        nim: "9923800002",
        name: "Penghuni Uji Cuti",
      });
      const leftElsewhere = await addTestStudent(db, program, {
        ...more,
        nim: "9923800003",
        name: "Penghuni Uji Cuti Lain",
      });
      const otherRoom = await addTestRoom(db, { number: "S102" });
      await placeTestResident(db, roomId, left);
      await placeTestResident(db, otherRoom, leftElsewhere);

      await freeStalePlacesIn(db, [2080], roomId);

      expect(await residentsOfRoom(db, roomId)).toEqual([studentId]);
      expect(await residentsOfRoom(db, otherRoom)).toEqual([leftElsewhere]);
    });
  });
});

describe("freeStalePlacesOf", () => {
  it("deletes the stale place of the students given only", async () => {
    await inTestDatabase(async (db) => {
      const { program, roomId, studentId } = await addPlacedResident(db);
      const more = { cohortYear: 2080, status: "on_leave" as const };
      const given = await addTestStudent(db, program, {
        ...more,
        nim: "9923800002",
        name: "Penghuni Uji Cuti",
      });
      const notGiven = await addTestStudent(db, program, {
        ...more,
        nim: "9923800003",
        name: "Penghuni Uji Cuti Lain",
      });
      await placeTestResident(db, roomId, given);
      await placeTestResident(db, roomId, notGiven);

      await freeStalePlacesOf(db, [2080], [given, studentId]);
      await freeStalePlacesOf(db, [2080], []);

      expect((await residentsOfRoom(db, roomId)).sort()).toEqual(
        [studentId, notGiven].sort(),
      );
    });
  });
});
