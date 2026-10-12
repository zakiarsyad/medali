import { describe, expect, it } from "vitest";
import type { Database } from "./connect";
import { dormRoomPlaces, dormRooms, students, studyPrograms } from "./schema";
import { withTestDatabase } from "./test-database";

const inTestDatabase = withTestDatabase();

const ROOM = {
  dorm: "dana_rakca",
  floor: 1,
  number: "101",
  capacity: 4,
} as const;

async function addRoom(
  db: Database,
  room: typeof dormRooms.$inferInsert,
): Promise<string> {
  const [added] = await db.insert(dormRooms).values(room).returning();
  if (!added) throw new Error("The room was not added.");
  return added.id;
}

async function addStudent(db: Database): Promise<string> {
  const [program] = await db
    .insert(studyPrograms)
    .values({ name: "Prodi Uji Kamar" })
    .returning();
  if (!program) throw new Error("The study program was not added.");
  const [student] = await db
    .insert(students)
    .values({
      nim: "9911260001",
      name: "Mahasiswi Uji",
      studyProgramId: program.id,
      entryPath: "regular",
      sex: "female",
      cohortYear: 2026,
    })
    .returning();
  if (!student) throw new Error("The student was not added.");
  return student.id;
}

describe("the dorm rooms", () => {
  it("refuse a room number used twice in one dorm", async () => {
    await inTestDatabase(async (db) => {
      await addRoom(db, ROOM);
      const again = db.insert(dormRooms).values({ ...ROOM, floor: 2 });
      await expect(again).rejects.toThrow();
    });
  });

  it("take the same room number in another dorm", async () => {
    await inTestDatabase(async (db) => {
      await addRoom(db, ROOM);
      await addRoom(db, { ...ROOM, dorm: "cipta_bakti" });
    });
  });

  it.each([0, 9])("refuse a room on floor %i", async (floor) => {
    await inTestDatabase(async (db) => {
      const added = db.insert(dormRooms).values({ ...ROOM, floor });
      await expect(added).rejects.toThrow();
    });
  });

  it.each([0, 13])("refuse a room that holds %i", async (capacity) => {
    await inTestDatabase(async (db) => {
      const added = db.insert(dormRooms).values({ ...ROOM, capacity });
      await expect(added).rejects.toThrow();
    });
  });

  it("refuse a resident a place in a second room", async () => {
    await inTestDatabase(async (db) => {
      const first = await addRoom(db, ROOM);
      const second = await addRoom(db, { ...ROOM, number: "102" });
      const studentId = await addStudent(db);
      await db.insert(dormRoomPlaces).values({ studentId, roomId: first });

      const again = db
        .insert(dormRoomPlaces)
        .values({ studentId, roomId: second });
      await expect(again).rejects.toThrow();
    });
  });

  it("refuse to remove a room that still has a resident", async () => {
    await inTestDatabase(async (db) => {
      const roomId = await addRoom(db, ROOM);
      const studentId = await addStudent(db);
      await db.insert(dormRoomPlaces).values({ studentId, roomId });

      await expect(db.delete(dormRooms)).rejects.toThrow();
    });
  });
});
