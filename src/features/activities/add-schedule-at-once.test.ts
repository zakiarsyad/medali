import { afterEach, describe, expect, it } from "vitest";
import {
  academicPeriods,
  accounts,
  activityScheduleParticipants,
  activitySchedules,
  ppksActivities,
  students,
  studyPrograms,
} from "@/db/schema";
import { withOwnTestDatabase } from "@/db/test-database-at-once";
import { addSchedule } from "./add-schedule";
import {
  addTestActivity,
  addTestActor,
  addTestPeriods,
  addTestProgram,
  addTestStudents,
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
  await own.db.delete(activityScheduleParticipants);
  await own.db.delete(activitySchedules);
  await own.db.delete(ppksActivities);
  await own.db.delete(academicPeriods);
  await own.db.delete(students);
  await own.db.delete(studyPrograms);
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
      value: {
        name: "Kegiatan uji jadwal",
        target: { kind: "semester", semester: 3 },
      },
    };
    expect(both.sooner).toEqual(added);
    expect(both.later).toEqual(added);
    expect(await own.db.select().from(activitySchedules)).toHaveLength(1);
  });

  it("adds one schedule of an extra activity, with its participants once", async () => {
    const actor = await addTestActor(own.db, "Pegawai Dua Kali", ["upk_staff"]);
    const activityId = await addTestActivity(own.db, actor.id, {
      semester: null,
    });
    await addTestPeriods(own.db, 2120);
    const programId = await addTestProgram(own.db, "UJIDUAKALI");
    await addTestStudents(own.db, programId, [
      { nim: "9974650001", name: "Uji Dua Kali", cohortYear: 2120 },
    ]);
    const sent = {
      ...SENT_SCHEDULE,
      kind: "extra",
      activityId,
      participants: { mode: "cohort", values: ["2120"] },
    };

    const both = await own.atOnce(
      (db) => addSchedule(db, actor, NEW_SCHEDULE_ID, sent),
      (db) => addSchedule(db, actor, NEW_SCHEDULE_ID, sent),
    );

    expect(both.sooner.ok).toBe(true);
    expect(both.later).toEqual(both.sooner);
    expect(await own.db.select().from(activitySchedules)).toHaveLength(1);
    expect(
      await own.db.select().from(activityScheduleParticipants),
    ).toHaveLength(1);
  });
});
