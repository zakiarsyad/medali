import { describe, expect, it } from "vitest";
import type { Database } from "./connect";
import { dormCompanions, dormRooms, students, studyPrograms } from "./schema";
import { withTestDatabase } from "./test-database";

const inTestDatabase = withTestDatabase();

async function addStudent(db: Database): Promise<string> {
  const [program] = await db
    .insert(studyPrograms)
    .values({ name: "Prodi Uji Tabel Kakak", code: "Prodi Uji Tabel Kakak" })
    .returning();
  if (!program) throw new Error("The study program was not added.");
  const [student] = await db
    .insert(students)
    .values({
      nim: "9929230001",
      name: "Mahasiswi Uji Kakak",
      studyProgramId: program.id,
      entryPath: "regular",
      sex: "female",
      cohortYear: 2023,
    })
    .returning();
  if (!student) throw new Error("The student was not added.");
  return student.id;
}

async function addRoom(db: Database): Promise<string> {
  const [room] = await db
    .insert(dormRooms)
    .values({ dorm: "dana_rakca", floor: 1, number: "K101", capacity: 4 })
    .returning();
  if (!room) throw new Error("The room was not added.");
  return room.id;
}

describe("the kakak pendamping", () => {
  it("start as active and without a room", async () => {
    await inTestDatabase(async (db) => {
      const studentId = await addStudent(db);

      const [added] = await db
        .insert(dormCompanions)
        .values({ studentId, dorm: "dana_rakca" })
        .returning();

      expect(added).toEqual({
        studentId,
        dorm: "dana_rakca",
        note: null,
        isActive: true,
        roomId: null,
      });
    });
  });

  it("refuse a student named a second time", async () => {
    await inTestDatabase(async (db) => {
      const studentId = await addStudent(db);
      await db.insert(dormCompanions).values({ studentId, dorm: "dana_rakca" });

      const again = db
        .insert(dormCompanions)
        .values({ studentId, dorm: "dana_rakca" });
      await expect(again).rejects.toThrow();
    });
  });

  it.each(["wismantara_putra", "wismantara_putri"] as const)(
    "refuse one for %s",
    async (dorm) => {
      await inTestDatabase(async (db) => {
        const studentId = await addStudent(db);
        const added = db.insert(dormCompanions).values({ studentId, dorm });
        await expect(added).rejects.toThrow();
      });
    },
  );

  it("refuse a room for one who is not active", async () => {
    await inTestDatabase(async (db) => {
      const studentId = await addStudent(db);
      const roomId = await addRoom(db);

      const added = db
        .insert(dormCompanions)
        .values({ studentId, dorm: "dana_rakca", isActive: false, roomId });
      await expect(added).rejects.toThrow();
    });
  });

  it("refuse to remove a room that still has one", async () => {
    await inTestDatabase(async (db) => {
      const studentId = await addStudent(db);
      const roomId = await addRoom(db);
      await db
        .insert(dormCompanions)
        .values({ studentId, dorm: "dana_rakca", roomId });

      await expect(db.delete(dormRooms)).rejects.toThrow();
    });
  });
});
