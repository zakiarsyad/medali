import { afterEach, describe, expect, it } from "vitest";
import {
  academicPeriods,
  accounts,
  activitySchedules,
  ppksActivities,
} from "@/db/schema";
import { withOwnTestDatabase } from "@/db/test-database-at-once";
import { addSchedule } from "./add-schedule";
import {
  addTestActivity,
  addTestActor,
  addTestPeriods,
  NEW_SCHEDULE_ID,
  SENT_SCHEDULE,
} from "./test-records";

/*
 * Two saves at the same moment need two connections that both see the
 * saved rows, so these checks have a database of their own, dropped at
 * the end.
 */
const own = withOwnTestDatabase("jadwaltambah");

afterEach(async () => {
  await own.db.delete(activitySchedules);
  await own.db.delete(ppksActivities);
  await own.db.delete(academicPeriods);
  await own.db.delete(accounts);
});

describe("Simpan jadwal pressed twice at the same moment", () => {
  it("adds one schedule: the second press waits for the first, then finds its schedule saved", async () => {
    const actor = await addTestActor(own.db, "Pegawai Dua Kali", ["upk_staff"]);
    const activityId = await addTestActivity(own.db, actor.id);
    await addTestPeriods(own.db, 2120);
    const sent = { ...SENT_SCHEDULE, activityId };

    const both = await own.atOnce(
      (db) => addSchedule(db, actor, NEW_SCHEDULE_ID, sent),
      (db) => addSchedule(db, actor, NEW_SCHEDULE_ID, sent),
    );

    const added = {
      ok: true,
      value: { name: "Kegiatan uji jadwal", semester: 3 },
    };
    expect(both.sooner).toEqual(added);
    expect(both.later).toEqual(added);
    expect(await own.db.select().from(activitySchedules)).toHaveLength(1);
  });
});
