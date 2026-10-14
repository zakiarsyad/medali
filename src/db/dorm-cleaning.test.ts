import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { Database } from "./connect";
import {
  accounts,
  dormCleaningDuties,
  dormCleaningPlaces,
  dormRooms,
} from "./schema";
import { withTestDatabase } from "./test-database";

const inTestDatabase = withTestDatabase();

/*
 * The names and room numbers here are used by no other file of checks:
 * two checks that add the same one wait for each other.
 */
const PLACE = { dorm: "cipta_bakti", name: "Selasar Uji Tabel" } as const;
const DAY = "2026-10-12";

async function addAccount(db: Database): Promise<string> {
  const [account] = await db
    .insert(accounts)
    .values({ name: "Pengelola Uji Tabel Bersih" })
    .returning();
  if (!account) throw new Error("The account was not added.");
  return account.id;
}

async function addPlace(
  db: Database,
  place: typeof dormCleaningPlaces.$inferInsert = PLACE,
): Promise<string> {
  const [added] = await db.insert(dormCleaningPlaces).values(place).returning();
  if (!added) throw new Error("The place was not added.");
  return added.id;
}

async function addRoom(db: Database, number: string): Promise<string> {
  const [room] = await db
    .insert(dormRooms)
    .values({ dorm: "cipta_bakti", floor: 1, number, capacity: 4 })
    .returning();
  if (!room) throw new Error("The room was not added.");
  return room.id;
}

interface Duty {
  placeId: string | null;
  roomId: string;
  roomNumber: string;
  createdBy: string;
}

function addDuty(db: Database, duty: Duty) {
  return db
    .insert(dormCleaningDuties)
    .values({ day: DAY, dorm: "cipta_bakti", ...duty });
}

describe("the cleaning places", () => {
  it("refuse a name used twice in one dorm, whatever its capitals", async () => {
    await inTestDatabase(async (db) => {
      await addPlace(db);
      const again = addPlace(db, { ...PLACE, name: "selasar uji TABEL" });
      await expect(again).rejects.toThrow();
    });
  });

  it("take the same name in another dorm", async () => {
    await inTestDatabase(async (db) => {
      await addPlace(db);
      await addPlace(db, { ...PLACE, dorm: "dana_rakca" });
    });
  });

  it("take the name of a place that is removed", async () => {
    await inTestDatabase(async (db) => {
      const by = await addAccount(db);
      await addPlace(db, {
        ...PLACE,
        removedFrom: DAY,
        deletedAt: new Date(),
        deletedBy: by,
      });
      await addPlace(db);
    });
  });

  it.each(["Ab", "A".repeat(61)])("refuse the name %s", async (name) => {
    await inTestDatabase(async (db) => {
      await expect(addPlace(db, { ...PLACE, name })).rejects.toThrow();
    });
  });

  it("refuse a removal mark without who removed it", async () => {
    await inTestDatabase(async (db) => {
      const removed = addPlace(db, {
        ...PLACE,
        removedFrom: DAY,
        deletedAt: new Date(),
      });
      await expect(removed).rejects.toThrow();
    });
  });
});

describe("the cleaning duties", () => {
  it("refuse a second duty for one place on one day", async () => {
    await inTestDatabase(async (db) => {
      const createdBy = await addAccount(db);
      const placeId = await addPlace(db);
      const one = await addRoom(db, "UB101");
      const two = await addRoom(db, "UB102");
      await addDuty(db, {
        placeId,
        roomId: one,
        roomNumber: "UB101",
        createdBy,
      });

      const again = addDuty(db, {
        placeId,
        roomId: two,
        roomNumber: "UB102",
        createdBy,
      });
      await expect(again).rejects.toThrow();
    });
  });

  it("refuse a second duty for one room's own room on one day", async () => {
    await inTestDatabase(async (db) => {
      const createdBy = await addAccount(db);
      const roomId = await addRoom(db, "UB103");
      const own = { placeId: null, roomId, roomNumber: "UB103", createdBy };
      await addDuty(db, own);

      await expect(addDuty(db, own)).rejects.toThrow();
    });
  });

  it("take a place and the own room of one room on the same day", async () => {
    await inTestDatabase(async (db) => {
      const createdBy = await addAccount(db);
      const placeId = await addPlace(db);
      const roomId = await addRoom(db, "UB104");
      await addDuty(db, { placeId, roomId, roomNumber: "UB104", createdBy });
      await addDuty(db, {
        placeId: null,
        roomId,
        roomNumber: "UB104",
        createdBy,
      });
    });
  });

  it("keep the room number of a duty whose room is removed", async () => {
    await inTestDatabase(async (db) => {
      const createdBy = await addAccount(db);
      const roomId = await addRoom(db, "UB105");
      await addDuty(db, {
        placeId: null,
        roomId,
        roomNumber: "UB105",
        createdBy,
      });

      await db.delete(dormRooms).where(eq(dormRooms.id, roomId));

      const kept = await db
        .select()
        .from(dormCleaningDuties)
        .where(eq(dormCleaningDuties.roomNumber, "UB105"));
      expect(kept).toHaveLength(1);
      expect(kept[0]?.roomId).toBeNull();
    });
  });
});
