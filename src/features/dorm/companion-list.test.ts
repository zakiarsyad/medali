// Sample Tahun akademik of this file: 2510 to 2510.
import { and, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import { academicPeriods, students } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import {
  addTestProgram,
  addTestRoom,
  addTestStudent,
} from "@/dorms/test-records";
import { PAGE_SIZE } from "@/ui/list-pages";
import { listCompanions } from "./companion-list";
import { addTestCompanion, EVERYONE } from "./test-records";

const inTestDatabase = withTestDatabase();

/*
 * A period far from those of any other file of checks, so these wait for
 * none of them. Angkatan 2509 is in semester 3 in it.
 */
const ODD_2510 = {
  startYear: 2510,
  term: "odd",
  startsOn: "2510-08-01",
  endsOn: "2511-01-31",
} as const;
const DAY = "2510-10-12";
const BEFORE_ANY_PERIOD = "2510-01-01";

interface TestRows {
  ownProgram: number;
  roomId: string;
}

/**
 * Three kakak pendamping: an active woman in a room, an active man of
 * another program without one, and a woman who is not active.
 */
async function addTestRows(db: Database): Promise<TestRows> {
  await db.insert(academicPeriods).values(ODD_2510);
  const ownProgram = await addTestProgram(db, "Prodi Uji Kakak Sendiri");
  const otherProgram = await addTestProgram(db, "Prodi Uji Kakak Lain");
  const roomId = await addTestRoom(db, { number: "KD201", floor: 2 });
  const inRoom = await addTestStudent(db, ownProgram, {
    nim: "9931590002",
    name: "Sinta Uji",
    cohortYear: 2509,
  });
  const man = await addTestStudent(db, otherProgram, {
    nim: "9931590001",
    name: "Bima Uji",
    sex: "male",
    cohortYear: 2509,
  });
  const stopped = await addTestStudent(db, ownProgram, {
    nim: "9931590003",
    name: "Ajeng Uji",
    cohortYear: 2509,
  });
  await addTestCompanion(db, stopped, { isActive: false });
  await addTestCompanion(db, man, { dorm: "cipta_bakti" });
  await addTestCompanion(db, inRoom, { roomId, note: "Pendamping lantai 2" });
  return { ownProgram, roomId };
}

function names(list: { companions: { name: string }[] }): string[] {
  return list.companions.map((companion) => companion.name);
}

describe("listCompanions", () => {
  it("lists the active ones first, by dorm and name, and counts them", async () => {
    await inTestDatabase(async (db) => {
      await addTestRows(db);

      const list = await listCompanions(db, EVERYONE, 1, DAY);

      expect(names(list)).toEqual(["Sinta Uji", "Bima Uji", "Ajeng Uji"]);
      expect(list.matching).toBe(3);
      expect(list.active).toBe(2);
      expect(list.page).toBe(1);
    });
  });

  it("gives what a row shows of a kakak pendamping in a room", async () => {
    await inTestDatabase(async (db) => {
      const { roomId } = await addTestRows(db);

      const list = await listCompanions(db, EVERYONE, 1, DAY);

      expect(list.companions[0]).toEqual({
        studentId: expect.any(String),
        name: "Sinta Uji",
        nim: "9931590002",
        studyProgram: "Prodi Uji Kakak Sendiri",
        semester: 3,
        dorm: "dana_rakca",
        room: { id: roomId, floor: 2, number: "KD201" },
        note: "Pendamping lantai 2",
        isActive: true,
      });
    });
  });

  it("gives no room and no keterangan for one without them", async () => {
    await inTestDatabase(async (db) => {
      await addTestRows(db);

      const list = await listCompanions(db, EVERYONE, 1, DAY);

      expect(list.companions[1]).toMatchObject({
        name: "Bima Uji",
        dorm: "cipta_bakti",
        room: null,
        note: null,
      });
    });
  });

  it("gives no semester while no academic period runs", async () => {
    await inTestDatabase(async (db) => {
      await addTestRows(db);

      const list = await listCompanions(db, EVERYONE, 1, BEFORE_ANY_PERIOD);

      expect(list.companions.map((one) => one.semester)).toEqual([
        null,
        null,
        null,
      ]);
    });
  });

  it("lists and counts only the students the account may see", async () => {
    await inTestDatabase(async (db) => {
      const { ownProgram } = await addTestRows(db);
      const visible = and(EVERYONE, eq(students.studyProgramId, ownProgram));
      if (!visible) throw new Error("The condition was not made.");

      const list = await listCompanions(db, visible, 1, DAY);

      expect(names(list)).toEqual(["Sinta Uji", "Ajeng Uji"]);
      expect(list.matching).toBe(2);
      expect(list.active).toBe(1);
    });
  });

  it("leaves out a student who was removed", async () => {
    await inTestDatabase(async (db) => {
      await addTestRows(db);
      await db
        .update(students)
        .set({ deletedAt: new Date() })
        .where(eq(students.nim, "9931590001"));

      const list = await listCompanions(db, EVERYONE, 1, DAY);

      expect(names(list)).toEqual(["Sinta Uji", "Ajeng Uji"]);
    });
  });

  it("is empty when nobody was named", async () => {
    await inTestDatabase(async (db) => {
      const list = await listCompanions(db, EVERYONE, 1, DAY);

      expect(list).toEqual({ companions: [], matching: 0, active: 0, page: 1 });
    });
  });

  it("gives one page at a time, and the last page when asked past it", async () => {
    await inTestDatabase(async (db) => {
      const program = await addTestProgram(db, "Prodi Uji Kakak Banyak");
      for (let place = 1; place <= PAGE_SIZE + 2; place += 1) {
        const number = String(place).padStart(2, "0");
        const id = await addTestStudent(db, program, {
          nim: `99315800${number}`,
          name: `Kakak Uji ${number}`,
          cohortYear: 2508,
        });
        await addTestCompanion(db, id);
      }

      const first = await listCompanions(db, EVERYONE, 1, DAY);
      const past = await listCompanions(db, EVERYONE, 9, DAY);

      expect(first.companions).toHaveLength(PAGE_SIZE);
      expect(first.matching).toBe(PAGE_SIZE + 2);
      expect(past.page).toBe(2);
      expect(names(past)).toEqual(["Kakak Uji 26", "Kakak Uji 27"]);
    });
  });
});
