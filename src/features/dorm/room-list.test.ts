import { and, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import { students } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import {
  addTestProgram,
  addTestRoom,
  addTestStudent,
  placeTestResident,
} from "@/dorms/test-records";
import { UNPLACED_SHOWN } from "./room-limits";
import {
  countResidents,
  listUnplaced,
  type ResidentScope,
  readFloorResidents,
  readRooms,
} from "./room-list";
import { EVERYONE } from "./test-records";

const inTestDatabase = withTestDatabase();

const DANA_RAKCA: ResidentScope = {
  dorm: "dana_rakca",
  dormCohorts: [2026],
  visible: EVERYONE,
};

interface TestRows {
  ownProgram: number;
  roomId: string;
  /** Placed in the room, of the own program. */
  placed: string;
  /** Placed in the room, of another program. */
  placedOther: string;
  /** Without a room, of the own program. */
  waiting: string;
}

/** One room of Dana Rakca with two residents, and one resident without. */
async function addTestRows(db: Database): Promise<TestRows> {
  const ownProgram = await addTestProgram(db, "Prodi Uji Daftar Kamar Sendiri");
  const otherProgram = await addTestProgram(db, "Prodi Uji Daftar Kamar Lain");
  const placed = await addTestStudent(db, ownProgram, {
    nim: "9924260002",
    name: "Sari Uji",
  });
  const placedOther = await addTestStudent(db, otherProgram, {
    nim: "9924260001",
    name: "Tari Uji",
  });
  const waiting = await addTestStudent(db, ownProgram, {
    nim: "9924260003",
    name: "Umi Uji",
  });
  await addTestStudent(db, ownProgram, {
    nim: "9924260004",
    name: "Bukan Penghuni Uji",
    cohortYear: 2024,
  });
  const roomId = await addTestRoom(db, { number: "L101" });
  await placeTestResident(db, roomId, placed);
  await placeTestResident(db, roomId, placedOther);
  return { ownProgram, roomId, placed, placedOther, waiting };
}

function onlyProgram(id: number): ResidentScope {
  const visible = and(EVERYONE, eq(students.studyProgramId, id));
  if (!visible) throw new Error("The condition was not made.");
  return { ...DANA_RAKCA, visible };
}

describe("readRooms", () => {
  it("lists the rooms of one dorm by floor and number, with places taken", async () => {
    await inTestDatabase(async (db) => {
      const { roomId } = await addTestRows(db);
      await addTestRoom(db, { floor: 2, number: "L201", capacity: 6 });
      await addTestRoom(db, { number: "L100" });
      await addTestRoom(db, { number: "L101", dorm: "cipta_bakti" });

      const rooms = await readRooms(db, "dana_rakca", [2026]);

      expect(rooms.map((room) => room.number)).toEqual([
        "L100",
        "L101",
        "L201",
      ]);
      expect(rooms[1]).toEqual({
        id: roomId,
        floor: 1,
        number: "L101",
        capacity: 4,
        taken: 2,
      });
      expect(rooms[2]?.taken).toBe(0);
    });
  });
});

describe("readFloorResidents", () => {
  it("lists the residents in the rooms of a floor, in NIM order", async () => {
    await inTestDatabase(async (db) => {
      const { roomId, placed, placedOther } = await addTestRows(db);

      const residents = await readFloorResidents(db, DANA_RAKCA, 1);

      expect(residents).toEqual([
        { id: placedOther, name: "Tari Uji", nim: "9924260001", roomId },
        { id: placed, name: "Sari Uji", nim: "9924260002", roomId },
      ]);
    });
  });

  it("lists nobody on a floor without residents", async () => {
    await inTestDatabase(async (db) => {
      await addTestRows(db);

      expect(await readFloorResidents(db, DANA_RAKCA, 2)).toEqual([]);
    });
  });

  it("shows a Ketua Program Studi only residents of their program", async () => {
    await inTestDatabase(async (db) => {
      const { ownProgram, placed } = await addTestRows(db);

      const residents = await readFloorResidents(
        db,
        onlyProgram(ownProgram),
        1,
      );

      expect(residents.map((resident) => resident.id)).toEqual([placed]);
    });
  });
});

describe("countResidents", () => {
  it("counts the residents of the dorm and those with a room", async () => {
    await inTestDatabase(async (db) => {
      await addTestRows(db);

      expect(await countResidents(db, DANA_RAKCA)).toEqual({
        residents: 3,
        placed: 2,
      });
    });
  });

  it("counts for a Ketua Program Studi only residents of their program", async () => {
    await inTestDatabase(async (db) => {
      const { ownProgram } = await addTestRows(db);

      expect(await countResidents(db, onlyProgram(ownProgram))).toEqual({
        residents: 2,
        placed: 1,
      });
    });
  });

  it("counts nobody in a dorm without residents", async () => {
    await inTestDatabase(async (db) => {
      await addTestRows(db);
      const scope: ResidentScope = { ...DANA_RAKCA, dorm: "cipta_bakti" };

      expect(await countResidents(db, scope)).toEqual({
        residents: 0,
        placed: 0,
      });
    });
  });
});

describe("listUnplaced", () => {
  it("lists the residents of the dorm who have no room", async () => {
    await inTestDatabase(async (db) => {
      const { waiting } = await addTestRows(db);

      const unplaced = await listUnplaced(db, DANA_RAKCA, "");

      expect(unplaced).toEqual({
        shown: [{ id: waiting, name: "Umi Uji", nim: "9924260003" }],
        matching: 1,
      });
    });
  });

  it("lists nobody for a program without residents waiting", async () => {
    await inTestDatabase(async (db) => {
      await addTestRows(db);
      const other = await addTestProgram(db, "Prodi Uji Daftar Kamar Kosong");

      expect(await listUnplaced(db, onlyProgram(other), "")).toEqual({
        shown: [],
        matching: 0,
      });
    });
  });

  it("shows at most 60, counts them all, and finds one past the 60 by search", async () => {
    await inTestDatabase(async (db) => {
      const program = await addTestProgram(db, "Prodi Uji Daftar Kamar Ramai");
      const more = UNPLACED_SHOWN + 5;
      await db.insert(students).values(
        Array.from({ length: more }, (_, place) => ({
          nim: `99242601${String(place).padStart(2, "0")}`,
          name: `Ramai Uji ${String(place).padStart(2, "0")}`,
          studyProgramId: program,
          entryPath: "regular" as const,
          sex: "female" as const,
          cohortYear: 2026,
        })),
      );
      const scope = onlyProgram(program);

      const unplaced = await listUnplaced(db, scope, "");
      const last = await listUnplaced(db, scope, "uji 64");
      const byNim = await listUnplaced(db, scope, "9924260164");

      expect(unplaced.shown).toHaveLength(UNPLACED_SHOWN);
      expect(unplaced.matching).toBe(more);
      expect(unplaced.shown[0]?.nim).toBe("9924260100");
      expect(unplaced.shown.map((one) => one.nim)).not.toContain("9924260164");
      expect(last.shown.map((one) => one.nim)).toEqual(["9924260164"]);
      expect(last.matching).toBe(1);
      expect(byNim.shown.map((one) => one.name)).toEqual(["Ramai Uji 64"]);
    });
  });
});
