// Sample Tahun akademik of this file: 2820 to 2820.
import { describe, expect, it } from "vitest";
import { ROLE_IDS, type RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { activitySchedules } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { addPpksActivity } from "./add-ppks-activity";
import { ACTIVITY_NOT_FOUND, removePpksActivity } from "./change-ppks-activity";
import { ACTIVITIES_NOT_ALLOWED } from "./not-allowed";
import { readScheduleCount } from "./schedule-counts";
import {
  addTestActor,
  addTestPeriod,
  addTestSchedule,
  NEW_ACTIVITY_ID,
  SENT_SPECIAL_ACTIVITY,
} from "./test-records";

const inTestDatabase = withTestDatabase();

const MAY_MANAGE: RoleId[] = ["head_of_unit", "upk_staff"];
const MAY_NOT_MANAGE = ROLE_IDS.filter((role) => !MAY_MANAGE.includes(role));
const ID = NEW_ACTIVITY_ID;

/** Adds the activity of the checks with one schedule, and its period. */
async function addScheduled(db: Database) {
  const actor = await addTestActor(db, "Pegawai Uji", ["upk_staff"]);
  await addPpksActivity(db, actor, ID, SENT_SPECIAL_ACTIVITY);
  const periodId = await addTestPeriod(db, 2820);
  const schedule = { activityId: ID, periodId, actorId: actor.id };
  await addTestSchedule(db, schedule);
  return { actor, schedule };
}

describe("readScheduleCount", () => {
  it.each(MAY_MANAGE)(
    "gives %s the count of schedules not removed",
    async (role) => {
      await inTestDatabase(async (db) => {
        const { actor, schedule } = await addScheduled(db);
        await addTestSchedule(db, { ...schedule, isRemoved: true });

        const counted = await readScheduleCount(
          db,
          { ...actor, roles: [role] },
          ID,
        );

        expect(counted).toEqual({ ok: true, value: 1 });
      });
    },
  );

  it.each(MAY_NOT_MANAGE)("refuses %s", async (role) => {
    await inTestDatabase(async (db) => {
      const { actor } = await addScheduled(db);

      const counted = await readScheduleCount(
        db,
        { ...actor, roles: [role] },
        ID,
      );

      expect(counted).toEqual(ACTIVITIES_NOT_ALLOWED);
    });
  });

  it("gives the count as it is now, with a schedule added after the page was read", async () => {
    await inTestDatabase(async (db) => {
      const { actor, schedule } = await addScheduled(db);
      expect(await readScheduleCount(db, actor, ID)).toEqual({
        ok: true,
        value: 1,
      });
      const other = await addTestActor(db, "Kepala Uji", ["head_of_unit"]);

      await addTestSchedule(db, { ...schedule, actorId: other.id });

      expect(await readScheduleCount(db, actor, ID)).toEqual({
        ok: true,
        value: 2,
      });
    });
  });

  it("gives 0 for an activity never scheduled", async () => {
    await inTestDatabase(async (db) => {
      const actor = await addTestActor(db, "Pegawai Uji", ["upk_staff"]);
      await addPpksActivity(db, actor, ID, SENT_SPECIAL_ACTIVITY);

      expect(await readScheduleCount(db, actor, ID)).toEqual({
        ok: true,
        value: 0,
      });
    });
  });

  it.each(["", "bukan-id"])(
    "finds no activity with the id '%s'",
    async (id) => {
      await inTestDatabase(async (db) => {
        const { actor } = await addScheduled(db);

        expect(await readScheduleCount(db, actor, id)).toEqual(
          ACTIVITY_NOT_FOUND,
        );
      });
    },
  );

  it("keeps the schedules of an activity removed from the list", async () => {
    await inTestDatabase(async (db) => {
      const { actor } = await addScheduled(db);

      await removePpksActivity(db, actor, ID);

      const [kept] = await db.select().from(activitySchedules);
      expect(kept?.activityId).toBe(ID);
      expect(kept?.deletedAt).toBeNull();
    });
  });
});
