import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import { dormCompanions } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import {
  ownRoomWords,
  readOwnRoom,
  readStudentRoom,
  roomHeader,
} from "./student-room";
import {
  addTestProgram,
  addTestRoom,
  addTestStudent,
  placeTestResident,
} from "./test-records";

const inTestDatabase = withTestDatabase();

/** A Pembibitan woman, who lives in Wismantara Putri. */
async function addWismantaraResident(db: Database): Promise<string> {
  const program = await addTestProgram(db, "Prodi Uji Asrama R");
  return addTestStudent(db, program, {
    nim: "9927260002",
    name: "Pendamping Uji",
    cohortYear: 2023,
    isSeedling: true,
  });
}

async function placeAsCompanion(
  db: Database,
  studentId: string,
  roomId: string,
): Promise<void> {
  await db
    .insert(dormCompanions)
    .values({ studentId, dorm: "dana_rakca", roomId });
}

describe("ownRoomWords", () => {
  it("names a resident's own room as the header does", () => {
    const room = {
      dorm: "cipta_bakti",
      floor: 2,
      number: "204",
      asCompanion: false,
    } as const;
    expect(ownRoomWords(room)).toBe("Asrama Cipta Bakti, lantai 2, kamar 204");
  });

  it("marks a kakak pendamping room", () => {
    const room = {
      dorm: "dana_rakca",
      floor: 1,
      number: "102",
      asCompanion: true,
    } as const;
    expect(ownRoomWords(room)).toBe(
      "Asrama Dana Rakca, lantai 1, kamar 102 (kakak pendamping)",
    );
  });

  it("says Belum diplot for a student without a room", () => {
    expect(ownRoomWords(null)).toBe("Belum diplot");
  });
});

describe("readOwnRoom", () => {
  it("gives the room in the resident's own dorm, not as kakak pendamping", async () => {
    await inTestDatabase(async (db) => {
      const program = await addTestProgram(db, "Prodi Uji Asrama R");
      const id = await addTestStudent(db, program, {
        nim: "9927260001",
        name: "Penghuni Uji",
      });
      const roomId = await addTestRoom(db, { floor: 2, number: "R204" });
      await placeTestResident(db, roomId, id);

      expect(await readOwnRoom(db, id, "dana_rakca")).toEqual({
        dorm: "dana_rakca",
        floor: 2,
        number: "R204",
        asCompanion: false,
      });
    });
  });

  it("gives the kakak pendamping room to a resident with no room in their own dorm", async () => {
    await inTestDatabase(async (db) => {
      const id = await addWismantaraResident(db);
      const roomId = await addTestRoom(db, { floor: 1, number: "R102" });
      await placeAsCompanion(db, id, roomId);

      expect(await readOwnRoom(db, id, "wismantara_putri")).toEqual({
        dorm: "dana_rakca",
        floor: 1,
        number: "R102",
        asCompanion: true,
      });
    });
  });

  it("gives no room once the kakak pendamping is taken out of the room", async () => {
    await inTestDatabase(async (db) => {
      const id = await addWismantaraResident(db);
      const roomId = await addTestRoom(db, { number: "R102" });
      await placeAsCompanion(db, id, roomId);

      await db
        .update(dormCompanions)
        .set({ roomId: null })
        .where(eq(dormCompanions.studentId, id));

      expect(await readOwnRoom(db, id, "wismantara_putri")).toBeNull();
    });
  });

  it("gives no room once the duty is stopped", async () => {
    await inTestDatabase(async (db) => {
      const id = await addWismantaraResident(db);
      const roomId = await addTestRoom(db, { number: "R102" });
      await placeAsCompanion(db, id, roomId);

      await db
        .update(dormCompanions)
        .set({ isActive: false, roomId: null })
        .where(eq(dormCompanions.studentId, id));

      expect(await readOwnRoom(db, id, "wismantara_putri")).toBeNull();
    });
  });

  it("gives no room to a resident with neither room", async () => {
    await inTestDatabase(async (db) => {
      const id = await addWismantaraResident(db);

      expect(await readOwnRoom(db, id, "wismantara_putri")).toBeNull();
    });
  });
});

describe("roomHeader", () => {
  it("names the dorm, the floor and the room of a resident", () => {
    const room = { floor: 2, number: "204" };
    expect(roomHeader("wismantara_putri", room)).toBe(
      "Asrama Wismantara Putri, lantai 2, kamar 204",
    );
  });

  it("says Belum diplot for a resident without a room", () => {
    expect(roomHeader("cipta_bakti", null)).toBe("Belum diplot");
  });
});

describe("readStudentRoom", () => {
  it("gives the floor and the number of the room of a resident", async () => {
    await inTestDatabase(async (db) => {
      const program = await addTestProgram(db, "Prodi Uji Asrama R");
      const id = await addTestStudent(db, program, {
        nim: "9927260001",
        name: "Penghuni Uji",
      });
      const roomId = await addTestRoom(db, { floor: 2, number: "R204" });
      await placeTestResident(db, roomId, id);

      expect(await readStudentRoom(db, id, "dana_rakca")).toEqual({
        floor: 2,
        number: "R204",
      });
    });
  });

  it("gives no room to a resident who has none", async () => {
    await inTestDatabase(async (db) => {
      const program = await addTestProgram(db, "Prodi Uji Asrama R");
      const id = await addTestStudent(db, program, {
        nim: "9927260001",
        name: "Penghuni Uji",
      });
      await addTestRoom(db, { number: "R101" });

      expect(await readStudentRoom(db, id, "dana_rakca")).toBeNull();
    });
  });

  it("gives no room for a place left behind in another dorm", async () => {
    await inTestDatabase(async (db) => {
      const program = await addTestProgram(db, "Prodi Uji Asrama R");
      const id = await addTestStudent(db, program, {
        nim: "9927260001",
        name: "Penghuni Uji",
      });
      const roomId = await addTestRoom(db, { number: "R101" });
      await placeTestResident(db, roomId, id);

      expect(await readStudentRoom(db, id, "wismantara_putri")).toBeNull();
    });
  });
});
