import { describe, expect, it } from "vitest";
import { withTestDatabase } from "@/db/test-database";
import { readStudentRoom, roomHeader } from "./student-room";
import {
  addTestProgram,
  addTestRoom,
  addTestStudent,
  placeTestResident,
} from "./test-records";

const inTestDatabase = withTestDatabase();

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
