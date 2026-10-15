// Sample Tahun akademik of this file: 3100 to 3100.
import { describe, expect, it } from "vitest";
import { withTestDatabase } from "@/db/test-database";
import {
  addTestProgram,
  addTestRoom,
  addTestStudent,
  placeTestResident,
} from "@/dorms/test-records";
import { readOccupiedRooms } from "./cleaning-rooms";

const inTestDatabase = withTestDatabase();

/** Angkatan 3100 is in semester 1 in its odd period, so it lives in the dorm. */
const COHORTS = [3100];

describe("readOccupiedRooms", () => {
  it("gives the rooms of the dorm with residents and their number, and leaves an empty room out", async () => {
    await inTestDatabase(async (db) => {
      const program = await addTestProgram(db, "Prodi Uji Bersih Kamar");
      const one = await addTestStudent(db, program, {
        nim: "9981010001",
        name: "Penghuni Uji Satu",
        cohortYear: 3100,
      });
      const two = await addTestStudent(db, program, {
        nim: "9981010002",
        name: "Penghuni Uji Dua",
        cohortYear: 3100,
      });
      const full = await addTestRoom(db, { number: "BK101" });
      await addTestRoom(db, { number: "BK102" });
      await placeTestResident(db, full, one);
      await placeTestResident(db, full, two);

      const rooms = await readOccupiedRooms(db, "dana_rakca", COHORTS);

      expect(rooms.filter((room) => room.number.startsWith("BK"))).toEqual([
        { id: full, number: "BK101", residents: 2 },
      ]);
    });
  });

  it("does not count a student who no longer lives in the dorm", async () => {
    await inTestDatabase(async (db) => {
      const program = await addTestProgram(db, "Prodi Uji Bersih Kamar");
      const away = await addTestStudent(db, program, {
        nim: "9981010003",
        name: "Penghuni Uji Cuti",
        cohortYear: 3100,
        status: "on_leave",
      });
      const roomId = await addTestRoom(db, { number: "BK103" });
      await placeTestResident(db, roomId, away);

      const rooms = await readOccupiedRooms(db, "dana_rakca", COHORTS);

      expect(rooms.map((room) => room.id)).not.toContain(roomId);
    });
  });
});
