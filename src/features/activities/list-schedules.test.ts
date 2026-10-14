// Sample Tahun akademik of this file: 2110 to 2111.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import { ppksActivities } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { readCohortCounts } from "./cohort-counts";
import { listSchedules } from "./list-schedules";
import { countParticipants } from "./participants";
import {
  addTestActivity,
  addTestActor,
  addTestPeriods,
  addTestProgram,
  addTestSchedule,
  addTestStudents,
} from "./test-records";

/*
 * This file's own sample values: the Tahun akademik 2110 and 2111, the
 * program UJIJADWALDAFTAR and the NIMs 9971000000 to 9971000099.
 */

const inTestDatabase = withTestDatabase();

interface Records {
  actorId: string;
  activityId: string;
  /** Ganjil 2110/2111. */
  periodId: string;
}

async function addRecords(db: Database): Promise<Records> {
  const actor = await addTestActor(db, "Pegawai Uji Daftar Jadwal", [
    "upk_staff",
  ]);
  const activityId = await addTestActivity(db, actor.id);
  const periods = await addTestPeriods(db, 2110);
  return { actorId: actor.id, activityId, periodId: periods.oddId };
}

function scheduleOf(records: Records, startsOn: string) {
  return {
    activityId: records.activityId,
    academicPeriodId: records.periodId,
    changedBy: records.actorId,
    startsOn,
  };
}

describe("listSchedules", () => {
  it("lists the earliest first, by day and then by hour", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const late = await addTestSchedule(db, scheduleOf(records, "2110-09-20"));
      const afternoon = await addTestSchedule(db, {
        ...scheduleOf(records, "2110-09-10"),
        startTime: "13:00",
        endTime: "15:00",
      });
      const morning = await addTestSchedule(
        db,
        scheduleOf(records, "2110-09-10"),
      );

      const list = await listSchedules(db, null, 1);

      expect(list.schedules.map((schedule) => schedule.id)).toEqual([
        morning,
        afternoon,
        late,
      ]);
      expect(list.matching).toBe(3);
    });
  });

  it("gives each with its hours without seconds, its activity and its period", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const id = await addTestSchedule(db, {
        ...scheduleOf(records, "2110-09-10"),
        endsOn: "2110-09-12",
        uploadCount: 2,
        uploadUnit: "week",
        isRequired: false,
      });

      const list = await listSchedules(db, null, 1);

      expect(list.schedules).toEqual([
        {
          id,
          startsOn: "2110-09-10",
          endsOn: "2110-09-12",
          startTime: "07:30",
          endTime: "11:30",
          uploadCount: 2,
          uploadUnit: "week",
          location: "Aula uji",
          isRequired: false,
          activity: {
            id: records.activityId,
            name: "Kegiatan uji jadwal",
            semester: 3,
            valueKeys: ["M", "D"],
            indicatorCodes: ["M2", "D2"],
            targetParticipants: 40,
            isRequired: true,
          },
          period: { startYear: 2110, term: "odd" },
          version: expect.any(String),
        },
      ]);
    });
  });

  it("leaves out a schedule that was removed", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const kept = await addTestSchedule(db, scheduleOf(records, "2110-09-10"));
      await addTestSchedule(db, {
        ...scheduleOf(records, "2110-09-11"),
        deletedAt: new Date(),
        deletedBy: records.actorId,
      });

      const list = await listSchedules(db, null, 1);

      expect(list.schedules.map((schedule) => schedule.id)).toEqual([kept]);
      expect(list.matching).toBe(1);
    });
  });

  it("keeps the schedule of an activity removed from Kurikulum since, still with its name", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const id = await addTestSchedule(db, scheduleOf(records, "2110-09-10"));
      await db
        .update(ppksActivities)
        .set({ deletedAt: new Date(), deletedBy: records.actorId })
        .where(eq(ppksActivities.id, records.activityId));

      const list = await listSchedules(db, null, 1);

      expect(list.schedules.map((schedule) => schedule.id)).toEqual([id]);
      expect(list.schedules[0]?.activity.name).toBe("Kegiatan uji jadwal");
    });
  });

  it("shows the name the activity has in Kurikulum now", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      await addTestSchedule(db, scheduleOf(records, "2110-09-10"));
      await db
        .update(ppksActivities)
        .set({ name: "Kegiatan uji berganti nama" })
        .where(eq(ppksActivities.id, records.activityId));

      const list = await listSchedules(db, null, 1);

      expect(list.schedules[0]?.activity.name).toBe(
        "Kegiatan uji berganti nama",
      );
    });
  });

  it("shows only the schedules of the tahap that is chosen", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const ofSemester = async (semester: number, startsOn: string) => {
        const activityId = await addTestActivity(db, records.actorId, {
          semester,
          name: `Kegiatan uji semester ${semester}`,
        });
        return addTestSchedule(db, {
          ...scheduleOf(records, startsOn),
          activityId,
        });
      };
      const first = await ofSemester(1, "2110-09-01");
      const second = await ofSemester(2, "2110-09-02");
      const third = await ofSemester(3, "2110-09-03");
      const eighth = await ofSemester(8, "2110-09-04");
      const idsOf = async (level: number | null) => {
        const list = await listSchedules(db, level, 1);
        expect(list.matching).toBe(list.schedules.length);
        return list.schedules.map((schedule) => schedule.id);
      };

      expect(await idsOf(null)).toEqual([first, second, third, eighth]);
      expect(await idsOf(1)).toEqual([first, second]);
      expect(await idsOf(2)).toEqual([third]);
      expect(await idsOf(3)).toEqual([]);
      expect(await idsOf(4)).toEqual([eighth]);
    });
  });

  it("shows 25 a page, and the last page when a later one is asked for", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      for (let day = 1; day <= 27; day += 1) {
        const startsOn = `2110-10-${String(day).padStart(2, "0")}`;
        await addTestSchedule(db, scheduleOf(records, startsOn));
      }

      const firstPage = await listSchedules(db, null, 1);
      const secondPage = await listSchedules(db, null, 2);
      const farPage = await listSchedules(db, null, 9);

      expect(firstPage.matching).toBe(27);
      expect(firstPage.schedules).toHaveLength(25);
      expect(firstPage.schedules[0]?.startsOn).toBe("2110-10-01");
      expect(secondPage.schedules.map((schedule) => schedule.startsOn)).toEqual(
        ["2110-10-26", "2110-10-27"],
      );
      expect(farPage.page).toBe(2);
      expect(farPage.schedules).toEqual(secondPage.schedules);
    });
  });
});

describe("the participants of a listed schedule", () => {
  async function addStudentsOfTwoYears(db: Database): Promise<void> {
    const programId = await addTestProgram(db, "UJIJADWALDAFTAR");
    await addTestStudents(db, programId, [
      { nim: "9971000001", name: "Mahasiswa Uji Lama Satu", cohortYear: 2110 },
      { nim: "9971000002", name: "Mahasiswa Uji Lama Dua", cohortYear: 2110 },
      { nim: "9971000011", name: "Mahasiswa Uji Baru Satu", cohortYear: 2111 },
      { nim: "9971000012", name: "Mahasiswa Uji Baru Dua", cohortYear: 2111 },
      { nim: "9971000013", name: "Mahasiswa Uji Baru Tiga", cohortYear: 2111 },
    ]);
  }

  it("are the students in its semester during its own period: one of an earlier period never counts this period's new students", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const later = await addTestPeriods(db, 2111);
      await addStudentsOfTwoYears(db);
      const firstSemester = await addTestActivity(db, records.actorId, {
        semester: 1,
        name: "Kegiatan uji semester satu",
      });
      const earlier = await addTestSchedule(db, {
        ...scheduleOf(records, "2110-09-10"),
        activityId: firstSemester,
      });
      const thisPeriod = await addTestSchedule(db, {
        ...scheduleOf(records, "2111-09-10"),
        activityId: firstSemester,
        academicPeriodId: later.oddId,
      });
      const olderStudents = await addTestSchedule(db, {
        ...scheduleOf(records, "2111-09-11"),
        academicPeriodId: later.oddId,
      });

      const [list, counts] = await Promise.all([
        listSchedules(db, null, 1),
        readCohortCounts(db),
      ]);
      const participants = new Map(
        list.schedules.map((schedule) => [
          schedule.id,
          countParticipants(
            counts,
            schedule.activity.semester,
            schedule.period,
          ),
        ]),
      );

      // Semester 1 in Ganjil 2110: the two of angkatan 2110, and none of
      // the three who came a year later.
      expect(participants.get(earlier)).toBe(2);
      expect(participants.get(thisPeriod)).toBe(3);
      // Semester 3 in Ganjil 2111: the angkatan 2110 again.
      expect(participants.get(olderStudents)).toBe(2);
    });
  });
});

describe("readCohortCounts", () => {
  it("counts the Aktif students of each angkatan, and none who is on Cuti, Non aktif or removed", async () => {
    await inTestDatabase(async (db) => {
      const actor = await addTestActor(db, "Pegawai Uji Hitung", ["upk_staff"]);
      const programId = await addTestProgram(db, "UJIJADWALDAFTAR");
      await addTestStudents(db, programId, [
        { nim: "9971000021", name: "Mahasiswa Uji Aktif A", cohortYear: 2110 },
        { nim: "9971000022", name: "Mahasiswa Uji Aktif B", cohortYear: 2110 },
        {
          nim: "9971000023",
          name: "Mahasiswa Uji Cuti",
          cohortYear: 2110,
          status: "on_leave",
        },
        {
          nim: "9971000024",
          name: "Mahasiswa Uji Non Aktif",
          cohortYear: 2110,
          status: "inactive",
        },
        {
          nim: "9971000025",
          name: "Mahasiswa Uji Dihapus",
          cohortYear: 2110,
          deletedAt: new Date(),
          deletedBy: actor.id,
        },
        { nim: "9971000026", name: "Mahasiswa Uji Aktif C", cohortYear: 2111 },
      ]);

      const counts = await readCohortCounts(db);

      expect(
        counts.sort((one, other) => one.cohortYear - other.cohortYear),
      ).toEqual([
        { cohortYear: 2110, students: 2 },
        { cohortYear: 2111, students: 1 },
      ]);
    });
  });
});
