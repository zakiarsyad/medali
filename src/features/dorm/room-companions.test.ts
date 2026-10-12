import { and, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import { students } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { readRoomCompanions } from "./room-companions";
import { readRooms } from "./room-list";
import { loadRooms } from "./rooms-view";
import {
  addTestCompanion,
  addTestProgram,
  addTestRoom,
  addTestStudent,
  EVERYONE,
  placeTestResident,
} from "./test-records";

const inTestDatabase = withTestDatabase();

/** The angkatan in a semester that lives in the dorm. */
const DORM_COHORTS = [2026];

interface TestRows {
  ownProgram: number;
  roomId: string;
  placed: string;
  placedOther: string;
  waiting: string;
}

/**
 * Dana Rakca with a room on floor 1 that holds a resident and two kakak
 * pendamping, one of them of another program; one kakak pendamping who
 * waits for a room, one who is stopped, and one of Cipta Bakti.
 */
async function addTestRows(db: Database): Promise<TestRows> {
  const ownProgram = await addTestProgram(db, "Prodi Uji Kamar Kakak Sendiri");
  const otherProgram = await addTestProgram(db, "Prodi Uji Kamar Kakak Lain");
  const roomId = await addTestRoom(db, { number: "KR101" });
  const senior = { cohortYear: 2024 };
  const resident = await addTestStudent(db, ownProgram, {
    nim: "9937260001",
    name: "Penghuni Uji",
  });
  await placeTestResident(db, roomId, resident);
  const placed = await addTestStudent(db, ownProgram, {
    ...senior,
    nim: "9937240002",
    name: "Sinta Uji",
  });
  await addTestCompanion(db, placed, { roomId });
  const placedOther = await addTestStudent(db, otherProgram, {
    ...senior,
    nim: "9937240001",
    name: "Tari Uji",
  });
  await addTestCompanion(db, placedOther, { roomId });
  const waiting = await addTestStudent(db, ownProgram, {
    ...senior,
    nim: "9937240003",
    name: "Umi Uji",
  });
  await addTestCompanion(db, waiting);
  const stopped = await addTestStudent(db, ownProgram, {
    ...senior,
    nim: "9937240004",
    name: "Ajeng Uji",
  });
  await addTestCompanion(db, stopped, { isActive: false });
  const man = await addTestStudent(db, ownProgram, {
    ...senior,
    nim: "9937240005",
    name: "Bima Uji",
    sex: "male",
  });
  await addTestCompanion(db, man, { dorm: "cipta_bakti" });
  return { ownProgram, roomId, placed, placedOther, waiting };
}

function read(db: Database, visible = EVERYONE, floor = 1) {
  return readRoomCompanions(db, { dorm: "dana_rakca", visible }, floor);
}

describe("readRooms", () => {
  it("counts a placed kakak pendamping among the places taken", async () => {
    await inTestDatabase(async (db) => {
      const { roomId } = await addTestRows(db);

      const rooms = await readRooms(db, "dana_rakca", DORM_COHORTS);

      expect(rooms.find((room) => room.id === roomId)?.taken).toBe(3);
    });
  });
});

describe("readRoomCompanions", () => {
  it("gives those placed on the floor, in NIM order, with their room", async () => {
    await inTestDatabase(async (db) => {
      const { roomId, placed, placedOther } = await addTestRows(db);

      const companions = await read(db);

      expect(companions.placed).toEqual([
        { id: placedOther, name: "Tari Uji", nim: "9937240001", roomId },
        { id: placed, name: "Sinta Uji", nim: "9937240002", roomId },
      ]);
    });
  });

  it("gives nobody placed on a floor without them", async () => {
    await inTestDatabase(async (db) => {
      await addTestRows(db);

      expect((await read(db, EVERYONE, 2)).placed).toEqual([]);
    });
  });

  it("offers the active ones of the dorm who have no room", async () => {
    await inTestDatabase(async (db) => {
      const { waiting } = await addTestRows(db);

      const companions = await read(db);

      expect(companions.waiting).toEqual([
        { id: waiting, name: "Umi Uji", nim: "9937240003" },
      ]);
    });
  });

  it("counts the active ones of the dorm, and those with a room", async () => {
    await inTestDatabase(async (db) => {
      await addTestRows(db);

      expect((await read(db)).counts).toEqual({ active: 3, placed: 2 });
    });
  });

  it("shows a Ketua Program Studi only those of their program", async () => {
    await inTestDatabase(async (db) => {
      const { ownProgram, placed } = await addTestRows(db);
      const visible = and(EVERYONE, eq(students.studyProgramId, ownProgram));
      if (!visible) throw new Error("The condition was not made.");

      const companions = await read(db, visible);

      expect(companions.placed.map((one) => one.id)).toEqual([placed]);
      expect(companions.counts).toEqual({ active: 2, placed: 1 });
    });
  });
});

describe("loadRooms", () => {
  const DAY = "2026-10-12";

  it("gives the kakak pendamping of Dana Rakca", async () => {
    await inTestDatabase(async (db) => {
      await addTestRows(db);
      const params = { dorm: "dana_rakca", floor: 1, query: "" } as const;

      const view = await loadRooms(db, params, EVERYONE, DAY);

      expect(view.companions?.counts).toEqual({ active: 3, placed: 2 });
    });
  });

  it.each(["wismantara_putra", "wismantara_putri"] as const)(
    "gives none for %s, which has no kakak pendamping",
    async (dorm) => {
      await inTestDatabase(async (db) => {
        await addTestRows(db);

        const view = await loadRooms(
          db,
          { dorm, floor: 1, query: "" },
          EVERYONE,
          DAY,
        );

        expect(view.companions).toBe(null);
      });
    },
  );
});
