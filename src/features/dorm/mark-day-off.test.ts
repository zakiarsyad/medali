import { describe, expect, it } from "vitest";
import { withTestDatabase } from "@/db/test-database";
import { listRoutines } from "./activity-lists";
import {
  ACTIVITIES_NOT_ALLOWED,
  ACTIVITY_CHANGED_BY_OTHER,
  ACTIVITY_NOT_FOUND,
  NO_DAY_PICKED,
  ONLY_ROUTINE_HAS_DAYS_OFF,
} from "./activity-messages";
import { changeActivity } from "./change-activity";
import { readDailyActivities } from "./daily-activities";
import { markDayOff } from "./mark-day-off";
import { removeActivity } from "./remove-activity";
import { addTestActivity, daysOffOf, SENT_ROUTINE } from "./test-activities";
import { addTestActor } from "./test-records";

const inTestDatabase = withTestDatabase();

const DAY = "2026-10-20";

describe("markDayOff", () => {
  it("takes the activity off that day only, and lists the day under Hari tanpa kegiatan", async () => {
    await inTestDatabase(async (db) => {
      const actor = await addTestActor(db, "Pengelola Libur", ["dorm_manager"]);
      const id = await addTestActivity(db, actor.id);

      const marked = await markDayOff(db, actor, id, DAY);

      expect(marked).toEqual({
        ok: true,
        value: "Ditandai tidak ada kegiatan pada 20 Okt 2026.",
      });
      expect(await readDailyActivities(db, DAY)).toEqual([]);
      expect(await readDailyActivities(db, "2026-10-21")).toHaveLength(1);
      const [routine] = await listRoutines(db);
      expect(routine?.daysOff).toEqual([DAY]);
    });
  });

  it("keeps a day marked twice once", async () => {
    await inTestDatabase(async (db) => {
      const actor = await addTestActor(db, "Pengelola Dua", ["dorm_manager"]);
      const id = await addTestActivity(db, actor.id);

      await markDayOff(db, actor, id, DAY);
      const again = await markDayOff(db, actor, id, DAY);

      expect(again.ok).toBe(true);
      expect(await daysOffOf(db, id)).toEqual([DAY]);
    });
  });

  it("counts as a change, so a form opened before it does not save its older days off over it", async () => {
    await inTestDatabase(async (db) => {
      const actor = await addTestActor(db, "Pengelola Form", ["dorm_manager"]);
      const id = await addTestActivity(db, actor.id);
      const [opened] = await listRoutines(db);
      if (!opened) throw new Error("The activity was not added.");
      await markDayOff(db, actor, id, DAY);

      const saved = await changeActivity(
        db,
        actor,
        id,
        opened.version,
        SENT_ROUTINE,
        "2026-10-14",
      );

      expect(saved).toEqual(ACTIVITY_CHANGED_BY_OTHER);
      expect(await daysOffOf(db, id)).toEqual([DAY]);
    });
  });

  it("refuses a one-off activity, a removed one, and a day that is no day", async () => {
    await inTestDatabase(async (db) => {
      const actor = await addTestActor(db, "Pengelola Tolak", ["dorm_manager"]);
      const oneOff = await addTestActivity(db, actor.id, {
        versions: [{ pattern: "once", startsOn: DAY, endsOn: DAY }],
      });
      const removed = await addTestActivity(db, actor.id);
      await removeActivity(db, actor, removed, "2026-10-14");

      expect(await markDayOff(db, actor, oneOff, DAY)).toEqual(
        ONLY_ROUTINE_HAS_DAYS_OFF,
      );
      expect(await markDayOff(db, actor, removed, DAY)).toEqual(
        ACTIVITY_NOT_FOUND,
      );
      expect(await markDayOff(db, actor, oneOff, "2026-02-30")).toEqual(
        NO_DAY_PICKED,
      );
    });
  });

  it.each(["bam_household", "bam_health", "director"] as const)(
    "refuses a hand-made mark by %s, and marks nothing",
    async (role) => {
      await inTestDatabase(async (db) => {
        const owner = await addTestActor(db, "Pengelola", ["dorm_manager"]);
        const id = await addTestActivity(db, owner.id);
        const actor = await addTestActor(db, "Bukan Pengelola", [role]);

        expect(await markDayOff(db, actor, id, DAY)).toEqual(
          ACTIVITIES_NOT_ALLOWED,
        );
        expect(await daysOffOf(db, id)).toEqual([]);
      });
    },
  );
});
