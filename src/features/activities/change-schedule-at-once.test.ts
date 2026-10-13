import { afterEach, describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import {
  academicPeriods,
  accounts,
  activitySchedules,
  ppksActivities,
} from "@/db/schema";
import { withOwnTestDatabase } from "@/db/test-database-at-once";
import { changeSchedule, SCHEDULE_CHANGED_BY_OTHER } from "./change-schedule";
import { listSchedules } from "./list-schedules";
import {
  addTestActivity,
  addTestActor,
  addTestPeriods,
  addTestSchedule,
  SENT_SCHEDULE,
  type TestActor,
} from "./test-records";

/*
 * Two saves at the same moment need two connections that both see the
 * saved rows, so these checks have a database of their own, dropped at
 * the end.
 */
const own = withOwnTestDatabase("jadwalubah");

afterEach(async () => {
  await own.db.delete(activitySchedules);
  await own.db.delete(ppksActivities);
  await own.db.delete(academicPeriods);
  await own.db.delete(accounts);
});

describe("two staff who save a change to one schedule at the same moment", () => {
  it("keep one change: the second waits for the first, then is told it has changed and overwrites nothing", async () => {
    const first = await addTestActor(own.db, "Pegawai Satu", ["upk_staff"]);
    const other = await addTestActor(own.db, "Kepala Dua", ["head_of_unit"]);
    const activityId = await addTestActivity(own.db, first.id);
    const periods = await addTestPeriods(own.db, 2120);
    const id = await addTestSchedule(own.db, {
      activityId,
      academicPeriodId: periods.oddId,
      changedBy: first.id,
      startsOn: "2120-09-10",
    });
    const [opened] = (await listSchedules(own.db, null, 1)).schedules;
    if (!opened) throw new Error("The schedule was not added.");
    const change = (actor: TestActor, location: string) => (db: Database) =>
      changeSchedule(db, actor, id, opened.version, {
        ...SENT_SCHEDULE,
        activityId,
        location,
      });

    const both = await own.atOnce(
      change(first, "Tempat pertama"),
      change(other, "Tempat kedua"),
    );

    expect(both.sooner).toEqual({
      ok: true,
      value: { name: "Kegiatan uji jadwal", semester: 3 },
    });
    expect(both.later).toEqual(SCHEDULE_CHANGED_BY_OTHER);
    const kept = await own.db.select().from(activitySchedules);
    expect(kept.map(({ location }) => location)).toEqual(["Tempat pertama"]);
    expect(kept[0]?.changedBy).toBe(first.id);
  });
});
