import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { ROLE_IDS, type RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { activitySchedules, ppksActivities } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { addSchedule, SCHEDULE_ALREADY_SENT } from "./add-schedule";
import { SCHEDULES_NOT_ALLOWED } from "./not-allowed";
import { NO_ACTIVITY, type SentSchedule } from "./schedule-input";
import { BEFORE_FIRST_PERIOD } from "./schedule-place";
import {
  addTestActivity,
  addTestActor,
  addTestPeriods,
  NEW_SCHEDULE_ID,
  SENT_SCHEDULE,
  type TestActor,
  type TestPeriods,
} from "./test-records";

/* This file's own sample values: the Tahun akademik 2120. */

const inTestDatabase = withTestDatabase();

const MAY_MANAGE: RoleId[] = ["head_of_unit", "upk_staff"];
const MAY_NOT_MANAGE = ROLE_IDS.filter((role) => !MAY_MANAGE.includes(role));
const ADDED = { ok: true, value: { name: "Kegiatan uji jadwal", semester: 3 } };
const OTHER_SCHEDULE_ID = "6e5d4c3b-2a1f-4e0d-9c8b-7a6f5e4d3c2b";

interface Records {
  actor: TestActor;
  periods: TestPeriods;
  sent: SentSchedule;
}

/** An actor, a PPKS activity of semester 3 and the two periods of 2120. */
async function addRecords(
  db: Database,
  roles: RoleId[] = ["upk_staff"],
): Promise<Records> {
  const actor = await addTestActor(db, "Pegawai Uji Tambah Jadwal", roles);
  const activityId = await addTestActivity(db, actor.id);
  const periods = await addTestPeriods(db, 2120);
  return { actor, periods, sent: { ...SENT_SCHEDULE, activityId } };
}

function stored(db: Database) {
  return db.select().from(activitySchedules);
}

describe("addSchedule", () => {
  it.each(MAY_MANAGE)(
    "lets %s add a schedule, kept with who changed it and when",
    async (role) => {
      await inTestDatabase(async (db) => {
        const { actor, periods, sent } = await addRecords(db, [role]);

        const added = await addSchedule(db, actor, NEW_SCHEDULE_ID, sent);

        expect(added).toEqual(ADDED);
        const [kept, ...more] = await stored(db);
        expect(more).toEqual([]);
        expect(kept).toMatchObject({
          id: NEW_SCHEDULE_ID,
          activityId: sent.activityId,
          academicPeriodId: periods.oddId,
          startsOn: "2120-09-10",
          endsOn: "2120-09-11",
          startTime: "07:30:00",
          endTime: "11:30:00",
          uploadCount: 1,
          uploadUnit: "day",
          location: "Aula uji",
          isRequired: true,
          changedBy: actor.id,
          deletedAt: null,
          deletedBy: null,
        });
        expect(kept?.changedAt).toBeInstanceOf(Date);
      });
    },
  );

  it("has roles that may not manage activities, Pengasuh and Direktur among them", () => {
    expect(MAY_NOT_MANAGE).toContain("mentor");
    expect(MAY_NOT_MANAGE).toContain("director");
    expect(MAY_NOT_MANAGE).toHaveLength(ROLE_IDS.length - MAY_MANAGE.length);
  });

  it.each(MAY_NOT_MANAGE)(
    "refuses %s, who reads the tab at most, and keeps nothing",
    async (role) => {
      await inTestDatabase(async (db) => {
        const { sent } = await addRecords(db);
        const reader = await addTestActor(db, "Pembaca Uji Jadwal", [role]);

        const added = await addSchedule(db, reader, NEW_SCHEDULE_ID, sent);

        expect(added).toEqual(SCHEDULES_NOT_ALLOWED);
        expect(await stored(db)).toEqual([]);
      });
    },
  );

  it("refuses a form with a fault in it, and keeps nothing", async () => {
    await inTestDatabase(async (db) => {
      const { actor, sent } = await addRecords(db);

      const added = await addSchedule(db, actor, NEW_SCHEDULE_ID, {
        ...sent,
        endTime: "07:30",
      });

      expect(added).toEqual({
        ok: false,
        error: "Jam selesai harus setelah jam mulai.",
      });
      expect(await stored(db)).toEqual([]);
    });
  });

  it("lets the same activity be scheduled more than once", async () => {
    await inTestDatabase(async (db) => {
      const { actor, sent } = await addRecords(db);

      await addSchedule(db, actor, NEW_SCHEDULE_ID, sent);
      const again = await addSchedule(db, actor, OTHER_SCHEDULE_ID, sent);

      expect(again).toEqual(ADDED);
      expect(await stored(db)).toHaveLength(2);
    });
  });
});

describe("the academic period a new schedule keeps", () => {
  async function periodOf(
    db: Database,
    startsOn: string,
  ): Promise<{ kept: string | undefined; periods: TestPeriods }> {
    const { actor, periods, sent } = await addRecords(db);
    const added = await addSchedule(db, actor, NEW_SCHEDULE_ID, {
      ...sent,
      startsOn,
      endsOn: startsOn,
    });
    expect(added).toEqual(ADDED);
    const [kept] = await stored(db);
    return { kept: kept?.academicPeriodId, periods };
  }

  it("is the one its first day falls in", async () => {
    await inTestDatabase(async (db) => {
      const inOdd = await periodOf(db, "2120-08-01");

      expect(inOdd.kept).toBe(inOdd.periods.oddId);
    });
    await inTestDatabase(async (db) => {
      const inEven = await periodOf(db, "2121-07-31");

      expect(inEven.kept).toBe(inEven.periods.evenId);
    });
  });

  it("is the one that ended last when its first day is between two periods", async () => {
    await inTestDatabase(async (db) => {
      const between = await periodOf(db, "2121-02-14");

      expect(between.kept).toBe(between.periods.oddId);
    });
  });

  it("is the last one stored when its first day is after it", async () => {
    await inTestDatabase(async (db) => {
      const after = await periodOf(db, "2121-11-05");

      expect(after.kept).toBe(after.periods.evenId);
    });
  });

  it("is the one of its first day, not of its last day in the next period", async () => {
    await inTestDatabase(async (db) => {
      const { actor, periods, sent } = await addRecords(db);

      await addSchedule(db, actor, NEW_SCHEDULE_ID, {
        ...sent,
        startsOn: "2121-02-27",
        endsOn: "2121-03-02",
      });

      const [kept] = await stored(db);
      expect(kept?.academicPeriodId).toBe(periods.oddId);
    });
  });

  it("is none before the first stored period: the schedule is refused and nothing is kept", async () => {
    await inTestDatabase(async (db) => {
      const { actor, sent } = await addRecords(db);

      const added = await addSchedule(db, actor, NEW_SCHEDULE_ID, {
        ...sent,
        startsOn: "2120-07-31",
        endsOn: "2120-08-02",
      });

      expect(added).toEqual(BEFORE_FIRST_PERIOD);
      expect(await stored(db)).toEqual([]);
    });
  });
});

describe("the activity of a new schedule", () => {
  it("must be one that is stored", async () => {
    await inTestDatabase(async (db) => {
      const { actor } = await addRecords(db);

      const added = await addSchedule(
        db,
        actor,
        NEW_SCHEDULE_ID,
        SENT_SCHEDULE,
      );

      expect(added).toEqual(NO_ACTIVITY);
      expect(await stored(db)).toEqual([]);
    });
  });

  it("must still be in the Kurikulum list", async () => {
    await inTestDatabase(async (db) => {
      const { actor, sent } = await addRecords(db);
      await db
        .update(ppksActivities)
        .set({ deletedAt: new Date(), deletedBy: actor.id })
        .where(eq(ppksActivities.id, sent.activityId));

      const added = await addSchedule(db, actor, NEW_SCHEDULE_ID, sent);

      expect(added).toEqual(NO_ACTIVITY);
      expect(await stored(db)).toEqual([]);
    });
  });

  it("must be a PPKS activity, not a special or additional one", async () => {
    await inTestDatabase(async (db) => {
      const { actor, sent } = await addRecords(db);
      const special = await addTestActivity(db, actor.id, {
        semester: null,
        name: "Kegiatan khusus uji jadwal",
      });

      const added = await addSchedule(db, actor, NEW_SCHEDULE_ID, {
        ...sent,
        activityId: special,
      });

      expect(added).toEqual(NO_ACTIVITY);
      expect(await stored(db)).toEqual([]);
    });
  });
});

describe("a new schedule sent a second time", () => {
  it("is kept once and answered as saved, when the same person sends the same form", async () => {
    await inTestDatabase(async (db) => {
      const { actor, sent } = await addRecords(db);
      await addSchedule(db, actor, NEW_SCHEDULE_ID, sent);

      const again = await addSchedule(db, actor, NEW_SCHEDULE_ID, sent);

      expect(again).toEqual(ADDED);
      expect(await stored(db)).toHaveLength(1);
    });
  });

  it.each([
    ["another last day", { endsOn: "2120-09-12" }],
    ["another first hour", { startTime: "08:00" }],
    ["another upload range", { uploadCount: "2" }],
    ["another unit", { uploadUnit: "week" }],
    ["another place", { location: "Lapangan uji" }],
    ["not required", { isRequired: false }],
  ])("is refused with %s, and what was kept stays", async (_kind, change) => {
    await inTestDatabase(async (db) => {
      const { actor, sent } = await addRecords(db);
      await addSchedule(db, actor, NEW_SCHEDULE_ID, sent);
      const before = await stored(db);

      const again = await addSchedule(db, actor, NEW_SCHEDULE_ID, {
        ...sent,
        ...change,
      });

      expect(again).toEqual(SCHEDULE_ALREADY_SENT);
      expect(await stored(db)).toEqual(before);
    });
  });

  it("is refused when another person sends it", async () => {
    await inTestDatabase(async (db) => {
      const { actor, sent } = await addRecords(db);
      const other = await addTestActor(db, "Kepala Uji Jadwal", [
        "head_of_unit",
      ]);
      await addSchedule(db, actor, NEW_SCHEDULE_ID, sent);

      const again = await addSchedule(db, other, NEW_SCHEDULE_ID, sent);

      expect(again).toEqual(SCHEDULE_ALREADY_SENT);
      const [kept] = await stored(db);
      expect(kept?.changedBy).toBe(actor.id);
    });
  });

  it("is refused once the schedule it added was removed", async () => {
    await inTestDatabase(async (db) => {
      const { actor, sent } = await addRecords(db);
      await addSchedule(db, actor, NEW_SCHEDULE_ID, sent);
      await db
        .update(activitySchedules)
        .set({ deletedAt: new Date(), deletedBy: actor.id });

      const again = await addSchedule(db, actor, NEW_SCHEDULE_ID, sent);

      expect(again).toEqual(SCHEDULE_ALREADY_SENT);
    });
  });

  it("is refused under a key that no form made", async () => {
    await inTestDatabase(async (db) => {
      const { actor, sent } = await addRecords(db);

      const added = await addSchedule(db, actor, "bukan-kunci", sent);

      expect(added).toEqual(SCHEDULE_ALREADY_SENT);
      expect(await stored(db)).toEqual([]);
    });
  });
});
