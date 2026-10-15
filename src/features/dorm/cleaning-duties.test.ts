// Sample Tahun akademik of this file: 3110 to 3110.
import { asc, eq, like } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import {
  academicPeriods,
  dormCleaningDuties,
  dormCleaningPlaces,
} from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import {
  addTestProgram,
  addTestRoom,
  addTestStudent,
  placeTestResident,
} from "@/dorms/test-records";
import { assignOwnRooms, assignPlaceDuty, cancelDuty } from "./cleaning-duties";
import { removeCleaningPlace } from "./cleaning-places";
import { removeRoom } from "./remove-room";
import { addTestActor, type TestActor } from "./test-records";

const inTestDatabase = withTestDatabase();

/*
 * A period far from those of any other file of checks, so these wait for
 * none of them. Angkatan 3110 is in semester 1 in it, so it lives in the
 * dorm. Room numbers, NIMs and place names here are used by no other file.
 */
const ODD_3110 = {
  startYear: 3110,
  term: "odd",
  startsOn: "3110-08-01",
  endsOn: "3111-01-31",
} as const;
const TODAY = "3110-10-12";
const YESTERDAY = "3110-10-11";
const TOMORROW = "3110-10-13";
const DORM = "dana_rakca";

const NOT_ALLOWED = {
  ok: false,
  error: "Anda tidak berhak mengelola pembersihan asrama.",
};
const NOT_FOUND = {
  ok: false,
  error: "Tempat atau kamar tidak ditemukan. Muat ulang halaman.",
};
const READ_ONLY: RoleId[] = [
  "head_of_unit",
  "director",
  "head_of_program",
  "student",
  "bam_compliance",
  "mentor",
];

interface Setting {
  manager: TestActor;
  placeId: string;
  /** BD101 with two residents, BD102 empty, BD103 with one resident. */
  full: string;
  empty: string;
  single: string;
}

async function addResident(db: Database, program: number, nim: string) {
  return addTestStudent(db, program, {
    nim,
    name: `Penghuni Uji ${nim}`,
    cohortYear: 3110,
  });
}

async function setUp(db: Database): Promise<Setting> {
  await db.insert(academicPeriods).values(ODD_3110);
  const program = await addTestProgram(db, "Prodi Uji Tugas Bersih");
  const full = await addTestRoom(db, { number: "BD101" });
  const empty = await addTestRoom(db, { number: "BD102" });
  const single = await addTestRoom(db, { number: "BD103" });
  await placeTestResident(
    db,
    full,
    await addResident(db, program, "9981020001"),
  );
  await placeTestResident(
    db,
    full,
    await addResident(db, program, "9981020002"),
  );
  await placeTestResident(
    db,
    single,
    await addResident(db, program, "9981020003"),
  );
  const [place] = await db
    .insert(dormCleaningPlaces)
    .values({ dorm: DORM, name: "Lorong Uji Tugas" })
    .returning();
  if (!place) throw new Error("The place was not added.");
  const manager = await addTestActor(db, "Pengelola Uji Tugas", [
    "dorm_manager",
  ]);
  return { manager, placeId: place.id, full, empty, single };
}

async function dutiesKept(db: Database) {
  return db
    .select()
    .from(dormCleaningDuties)
    .where(like(dormCleaningDuties.roomNumber, "BD%"))
    .orderBy(asc(dormCleaningDuties.day), asc(dormCleaningDuties.roomNumber));
}

describe("assignPlaceDuty", () => {
  it("gives the place to a room with residents on today or a later date", async () => {
    await inTestDatabase(async (db) => {
      const { manager, placeId, full, single } = await setUp(db);

      expect(
        await assignPlaceDuty(
          db,
          manager,
          { placeId, roomId: full, day: TODAY },
          TODAY,
        ),
      ).toEqual({ ok: true, value: "Kamar ditugaskan." });
      expect(
        await assignPlaceDuty(
          db,
          manager,
          { placeId, roomId: single, day: TOMORROW },
          TODAY,
        ),
      ).toEqual({ ok: true, value: "Kamar ditugaskan." });

      const kept = await dutiesKept(db);
      expect(
        kept.map(({ day, placeId: place, roomId, roomNumber, createdBy }) => ({
          day,
          place,
          roomId,
          roomNumber,
          createdBy,
        })),
      ).toEqual([
        {
          day: TODAY,
          place: placeId,
          roomId: full,
          roomNumber: "BD101",
          createdBy: manager.id,
        },
        {
          day: TOMORROW,
          place: placeId,
          roomId: single,
          roomNumber: "BD103",
          createdBy: manager.id,
        },
      ]);
    });
  });

  it("refuses a date before today", async () => {
    await inTestDatabase(async (db) => {
      const { manager, placeId, full } = await setUp(db);

      const given = await assignPlaceDuty(
        db,
        manager,
        { placeId, roomId: full, day: YESTERDAY },
        TODAY,
      );

      expect(given).toEqual({
        ok: false,
        error: "Tanggal sudah lewat. Pilih hari ini atau sesudahnya.",
      });
      expect(await dutiesKept(db)).toEqual([]);
    });
  });

  it("refuses a second room for the place on the same date", async () => {
    await inTestDatabase(async (db) => {
      const { manager, placeId, full, single } = await setUp(db);
      await assignPlaceDuty(
        db,
        manager,
        { placeId, roomId: full, day: TODAY },
        TODAY,
      );

      const again = await assignPlaceDuty(
        db,
        manager,
        { placeId, roomId: single, day: TODAY },
        TODAY,
      );

      expect(again).toEqual({
        ok: false,
        error:
          "Tempat ini sudah ditugaskan ke kamar lain pada tanggal ini. Muat ulang halaman.",
      });
      expect(await dutiesKept(db)).toHaveLength(1);
    });
  });

  it("refuses a room without residents, a room of another dorm and a removed place", async () => {
    await inTestDatabase(async (db) => {
      const { manager, placeId, full, empty } = await setUp(db);
      const elsewhere = await addTestRoom(db, {
        number: "BD201",
        dorm: "cipta_bakti",
      });

      expect(
        await assignPlaceDuty(
          db,
          manager,
          { placeId, roomId: empty, day: TODAY },
          TODAY,
        ),
      ).toEqual({
        ok: false,
        error: "Kamar ini tidak berpenghuni. Muat ulang halaman.",
      });
      expect(
        await assignPlaceDuty(
          db,
          manager,
          { placeId, roomId: elsewhere, day: TODAY },
          TODAY,
        ),
      ).toEqual(NOT_FOUND);
      await removeCleaningPlace(db, manager, placeId, TODAY);
      expect(
        await assignPlaceDuty(
          db,
          manager,
          { placeId, roomId: full, day: TODAY },
          TODAY,
        ),
      ).toEqual(NOT_FOUND);
      expect(await dutiesKept(db)).toEqual([]);
    });
  });

  it("asks for a room and a date", async () => {
    await inTestDatabase(async (db) => {
      const { manager, placeId, full } = await setUp(db);

      expect(
        await assignPlaceDuty(
          db,
          manager,
          { placeId, roomId: "", day: TODAY },
          TODAY,
        ),
      ).toEqual({ ok: false, error: "Pilih kamar bertugas." });
      expect(
        await assignPlaceDuty(
          db,
          manager,
          { placeId, roomId: full, day: "besok" },
          TODAY,
        ),
      ).toEqual({ ok: false, error: "Pilih tanggal." });
    });
  });

  it.each(READ_ONLY)(
    "refuses %s a hand-made change, and saves nothing",
    async (role) => {
      await inTestDatabase(async (db) => {
        const { placeId, full } = await setUp(db);
        const reader = await addTestActor(db, "Pembaca Uji Tugas", [role]);

        const given = await assignPlaceDuty(
          db,
          reader,
          { placeId, roomId: full, day: TODAY },
          TODAY,
        );

        expect(given).toEqual(NOT_ALLOWED);
        expect(await dutiesKept(db)).toEqual([]);
      });
    },
  );
});

describe("assignOwnRooms", () => {
  it("gives every room with residents its own room, skipping those already scheduled and the empty ones", async () => {
    await inTestDatabase(async (db) => {
      const { manager, single } = await setUp(db);
      await db.insert(dormCleaningDuties).values({
        day: TOMORROW,
        dorm: DORM,
        roomId: single,
        roomNumber: "BD103",
        createdBy: manager.id,
      });

      const given = await assignOwnRooms(
        db,
        manager,
        { dorm: DORM, day: TOMORROW },
        TODAY,
      );

      expect(given).toEqual({ ok: true, value: "1 tugas kamar dijadwalkan." });
      const kept = await dutiesKept(db);
      expect(kept.map((duty) => [duty.roomNumber, duty.placeId])).toEqual([
        ["BD101", null],
        ["BD103", null],
      ]);
    });
  });

  it("says when every room is scheduled already", async () => {
    await inTestDatabase(async (db) => {
      const { manager } = await setUp(db);
      await assignOwnRooms(db, manager, { dorm: DORM, day: TODAY }, TODAY);

      const again = await assignOwnRooms(
        db,
        manager,
        { dorm: DORM, day: TODAY },
        TODAY,
      );

      expect(again).toEqual({
        ok: true,
        value: "Semua kamar sudah dijadwalkan.",
      });
      expect(await dutiesKept(db)).toHaveLength(2);
    });
  });

  it("refuses a dorm whose rooms are not plotted, and a date before today", async () => {
    await inTestDatabase(async (db) => {
      const { manager } = await setUp(db);

      expect(
        await assignOwnRooms(
          db,
          manager,
          { dorm: "wismantara_putra", day: TODAY },
          TODAY,
        ),
      ).toEqual({ ok: false, error: "Kamar asrama ini belum diploting." });
      expect(
        await assignOwnRooms(
          db,
          manager,
          { dorm: DORM, day: YESTERDAY },
          TODAY,
        ),
      ).toEqual({
        ok: false,
        error: "Tanggal sudah lewat. Pilih hari ini atau sesudahnya.",
      });
      expect(await dutiesKept(db)).toEqual([]);
    });
  });

  it.each(READ_ONLY)("refuses %s, and saves nothing", async (role) => {
    await inTestDatabase(async (db) => {
      await setUp(db);
      const reader = await addTestActor(db, "Pembaca Uji Tugas", [role]);

      expect(
        await assignOwnRooms(db, reader, { dorm: DORM, day: TODAY }, TODAY),
      ).toEqual(NOT_ALLOWED);
      expect(await dutiesKept(db)).toEqual([]);
    });
  });
});

describe("cancelDuty", () => {
  async function dutyOn(db: Database, setting: Setting, day: string) {
    const [duty] = await db
      .insert(dormCleaningDuties)
      .values({
        day,
        dorm: DORM,
        placeId: setting.placeId,
        roomId: setting.full,
        roomNumber: "BD101",
        createdBy: setting.manager.id,
      })
      .returning();
    if (!duty) throw new Error("The duty was not added.");
    return duty.id;
  }

  it("removes a duty of today, and keeps one gone by as history", async () => {
    await inTestDatabase(async (db) => {
      const setting = await setUp(db);
      const today = await dutyOn(db, setting, TODAY);
      const past = await dutyOn(db, setting, YESTERDAY);

      expect(await cancelDuty(db, setting.manager, today, TODAY)).toEqual({
        ok: true,
        value: "Tugas dibatalkan.",
      });
      expect(await cancelDuty(db, setting.manager, past, TODAY)).toEqual({
        ok: false,
        error: "Tugas tidak ditemukan atau sudah lewat. Muat ulang halaman.",
      });
      expect((await dutiesKept(db)).map((duty) => duty.id)).toEqual([past]);
    });
  });

  it.each(READ_ONLY)("refuses %s, and keeps the duty", async (role) => {
    await inTestDatabase(async (db) => {
      const setting = await setUp(db);
      const dutyId = await dutyOn(db, setting, TODAY);
      const reader = await addTestActor(db, "Pembaca Uji Tugas", [role]);

      expect(await cancelDuty(db, reader, dutyId, TODAY)).toEqual(NOT_ALLOWED);
      expect(await dutiesKept(db)).toHaveLength(1);
    });
  });
});

describe("a room removed on Ploting kamar", () => {
  it("takes its duties from today on with it, and its past duties keep the room number", async () => {
    await inTestDatabase(async (db) => {
      const { manager, placeId, empty } = await setUp(db);
      const duty = {
        dorm: DORM,
        roomId: empty,
        roomNumber: "BD102",
        createdBy: manager.id,
      } as const;
      await db.insert(dormCleaningDuties).values([
        { ...duty, day: YESTERDAY, placeId },
        { ...duty, day: TODAY, placeId },
        { ...duty, day: TOMORROW, placeId: null },
      ]);

      const removed = await removeRoom(
        db,
        { roles: ["dorm_manager"] },
        empty,
        TODAY,
      );

      expect(removed.ok).toBe(true);
      const kept = await dutiesKept(db);
      expect(
        kept.map(({ day, roomId, roomNumber }) => ({
          day,
          roomId,
          roomNumber,
        })),
      ).toEqual([{ day: YESTERDAY, roomId: null, roomNumber: "BD102" }]);
    });
  });

  it("keeps its duties when the removal is refused", async () => {
    await inTestDatabase(async (db) => {
      const { manager, placeId, full } = await setUp(db);
      await db.insert(dormCleaningDuties).values({
        day: TOMORROW,
        dorm: DORM,
        placeId,
        roomId: full,
        roomNumber: "BD101",
        createdBy: manager.id,
      });

      const removed = await removeRoom(
        db,
        { roles: ["dorm_manager"] },
        full,
        TODAY,
      );

      expect(removed.ok).toBe(false);
      const [kept] = await db
        .select()
        .from(dormCleaningDuties)
        .where(eq(dormCleaningDuties.roomId, full));
      expect(kept?.day).toBe(TOMORROW);
    });
  });
});
