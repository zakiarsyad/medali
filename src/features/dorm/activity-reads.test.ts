import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import { academicPeriods, dormActivities, students } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { addTestProgram, addTestStudent } from "@/dorms/test-records";
import { PAGE_SIZE } from "@/ui/list-pages";
import { listOneOffs, listRoutines } from "./activity-lists";
import { readDailyActivities } from "./daily-activities";
import { countResidentsByDorm } from "./resident-counts";
import { addTestActivity } from "./test-activities";
import { addTestActor, EVERYONE } from "./test-records";

const inTestDatabase = withTestDatabase();

// 14 October 2026 is a Wednesday.
const DAY = "2026-10-14";
const ONCE = { pattern: "once", startsOn: DAY, endsOn: DAY } as const;

async function manager(db: Database): Promise<string> {
  const actor = await addTestActor(db, "Pengelola Uji Baca", ["dorm_manager"]);
  return actor.id;
}

async function remove(db: Database, id: string, by: string, from: string) {
  await db
    .update(dormActivities)
    .set({ deletedAt: new Date(), deletedBy: by, removedFrom: from })
    .where(eq(dormActivities.id, id));
}

function names(rows: { name: string }[]): string[] {
  return rows.map((row) => row.name);
}

describe("readDailyActivities", () => {
  it("gives the activities of the day by their first hour, with what each holds", async () => {
    await inTestDatabase(async (db) => {
      const by = await manager(db);
      await addTestActivity(db, by, {
        versions: [
          { ...ONCE, name: "Malam uji", startTime: "19:00", endTime: "21:00" },
        ],
      });
      const id = await addTestActivity(db, by, { daysOff: ["2026-10-08"] });
      await addTestActivity(db, by, {
        versions: [
          { name: "Kerja bakti uji", pattern: "weekly", weekdays: [6] },
        ],
      });

      const rows = await readDailyActivities(db, DAY);

      expect(names(rows)).toEqual(["Apel pagi uji", "Malam uji"]);
      expect(rows[0]).toMatchObject({
        id,
        startTime: "05:30",
        endTime: "06:15",
        organiser: "coach",
        audience: "all",
        rundown: [{ time: "05:30", activity: "Apel uji" }],
        daysOff: ["2026-10-08"],
        shownUntil: null,
        removedFrom: null,
      });
    });
  });

  it("leaves an activity out on its day off", async () => {
    await inTestDatabase(async (db) => {
      await addTestActivity(db, await manager(db), { daysOff: [DAY] });

      expect(await readDailyActivities(db, DAY)).toEqual([]);
      expect(names(await readDailyActivities(db, "2026-10-15"))).toEqual([
        "Apel pagi uji",
      ]);
    });
  });

  it("shows each day the version of that day", async () => {
    await inTestDatabase(async (db) => {
      await addTestActivity(db, await manager(db), {
        versions: [
          { shownUntil: "2026-10-13", startTime: "05:00", endTime: "05:45" },
          { shownFrom: DAY },
        ],
      });

      const before = await readDailyActivities(db, "2026-10-13");
      const after = await readDailyActivities(db, DAY);

      expect(before.map((row) => row.startTime)).toEqual(["05:00"]);
      expect(after.map((row) => row.startTime)).toEqual(["05:30"]);
    });
  });

  it("still shows a removed activity on the days before it stopped", async () => {
    await inTestDatabase(async (db) => {
      const by = await manager(db);
      const id = await addTestActivity(db, by);
      await remove(db, id, by, DAY);

      expect(names(await readDailyActivities(db, "2026-10-13"))).toEqual([
        "Apel pagi uji",
      ]);
      expect(await readDailyActivities(db, DAY)).toEqual([]);
    });
  });
});

describe("listRoutines", () => {
  it("gives the repeating activities as they are now, without the one-off and the removed ones", async () => {
    await inTestDatabase(async (db) => {
      const by = await manager(db);
      await addTestActivity(db, by, {
        versions: [
          { shownUntil: "2026-10-13", name: "Apel lama uji" },
          { shownFrom: DAY, name: "Apel baru uji" },
        ],
        daysOff: ["2026-10-20", "2026-10-08"],
      });
      await addTestActivity(db, by, {
        versions: [{ ...ONCE, name: "Malam uji" }],
      });
      const removed = await addTestActivity(db, by, {
        versions: [{ name: "Dihapus uji" }],
      });
      await remove(db, removed, by, DAY);

      const routines = await listRoutines(db);

      expect(names(routines)).toEqual(["Apel baru uji"]);
      expect(routines[0]?.daysOff).toEqual(["2026-10-08", "2026-10-20"]);
    });
  });
});

describe("listOneOffs", () => {
  it("gives one page at a time, the latest date first, without the repeating and the removed ones", async () => {
    await inTestDatabase(async (db) => {
      const by = await manager(db);
      await addTestActivity(db, by);
      for (let place = 0; place <= PAGE_SIZE; place++) {
        const on = `2026-09-${String(place + 1).padStart(2, "0")}`;
        await addTestActivity(db, by, {
          versions: [{ pattern: "once", startsOn: on, endsOn: on }],
        });
      }
      const removed = await addTestActivity(db, by, { versions: [ONCE] });
      await remove(db, removed, by, DAY);

      const first = await listOneOffs(db, 1);
      const second = await listOneOffs(db, 2);
      const beyond = await listOneOffs(db, 9);

      expect(first.matching).toBe(PAGE_SIZE + 1);
      expect(first.activities).toHaveLength(PAGE_SIZE);
      expect(first.activities[0]?.startsOn).toBe("2026-09-26");
      expect(second.activities.map((row) => row.startsOn)).toEqual([
        "2026-09-01",
      ]);
      expect(beyond.page).toBe(2);
    });
  });
});

describe("countResidentsByDorm", () => {
  /*
   * A period far from those of any other file of checks, so these wait
   * for none of them. Angkatan 2066 is in semester 1 in it.
   */
  const ODD_2066 = {
    startYear: 2066,
    term: "odd",
    startsOn: "2066-08-01",
    endsOn: "2067-01-31",
  } as const;
  const DAY_2066 = "2066-10-12";

  async function addResidents(db: Database): Promise<number> {
    await db.insert(academicPeriods).values(ODD_2066);
    const own = await addTestProgram(db, "Prodi Uji Kegiatan Sendiri");
    const other = await addTestProgram(db, "Prodi Uji Kegiatan Lain");
    const added = [
      { program: own, nim: "9936660001", sex: "female" as const },
      { program: own, nim: "9936660002", sex: "male" as const },
      { program: other, nim: "9936660003", sex: "female" as const },
      {
        program: other,
        nim: "9936660004",
        sex: "male" as const,
        isInternational: true,
      },
      // Semester 3: lives in no dorm.
      {
        program: own,
        nim: "9936660005",
        sex: "female" as const,
        cohortYear: 2065,
      },
      {
        program: own,
        nim: "9936660006",
        sex: "female" as const,
        status: "on_leave" as const,
      },
    ];
    for (const { program, ...student } of added) {
      await addTestStudent(db, program, {
        name: `Penghuni Uji ${student.nim}`,
        cohortYear: 2066,
        ...student,
      });
    }
    return own;
  }

  it("counts the residents of each dorm, and nobody who lives in none", async () => {
    await inTestDatabase(async (db) => {
      await addResidents(db);

      expect(await countResidentsByDorm(db, EVERYONE, DAY_2066)).toEqual({
        wismantara_putra: 1,
        wismantara_putri: 0,
        dana_rakca: 2,
        cipta_bakti: 1,
      });
    });
  });

  it("counts only the students the account may see: for Ketua Program Studi those of their program", async () => {
    await inTestDatabase(async (db) => {
      const own = await addResidents(db);
      const ownProgram = eq(students.studyProgramId, own);

      expect(await countResidentsByDorm(db, ownProgram, DAY_2066)).toEqual({
        wismantara_putra: 0,
        wismantara_putri: 0,
        dana_rakca: 1,
        cipta_bakti: 1,
      });
    });
  });

  it("counts only Internasional and Pembibitan residents while no academic period runs", async () => {
    await inTestDatabase(async (db) => {
      await addResidents(db);

      const counted = await countResidentsByDorm(db, EVERYONE, "2066-02-01");

      expect(counted).toEqual({
        wismantara_putra: 1,
        wismantara_putri: 0,
        dana_rakca: 0,
        cipta_bakti: 0,
      });
    });
  });
});
