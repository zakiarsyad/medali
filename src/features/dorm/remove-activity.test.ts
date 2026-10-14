import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import { withTestDatabase } from "@/db/test-database";
import { listOneOffs, listRoutines } from "./activity-lists";
import {
  ACTIVITIES_NOT_ALLOWED,
  ACTIVITY_NOT_FOUND,
  ONE_OFF_IS_PAST,
} from "./activity-messages";
import { readDailyActivities } from "./daily-activities";
import { removeActivity, restoreActivity } from "./remove-activity";
import { addTestActivity, storedActivity, versionsOf } from "./test-activities";
import { addTestActor, type TestActor } from "./test-records";

const inTestDatabase = withTestDatabase();

const TODAY = "2026-10-14";
const YESTERDAY = "2026-10-13";

async function manager(db: Database, name = "Pengelola Hapus") {
  return addTestActor(db, name, ["dorm_manager"]);
}

/** What Jadwal harian shows of a day, without how the rows are kept. */
async function shownOn(db: Database, day: string) {
  const rows = await readDailyActivities(db, day);
  return rows.map(
    ({ version, shownFrom, shownUntil, removedFrom, ...shown }) => shown,
  );
}

async function addAndRemove(db: Database, actor: TestActor): Promise<string> {
  const id = await addTestActivity(db, actor.id);
  const removed = await removeActivity(db, actor, id, TODAY);
  expect(removed).toEqual({ ok: true, value: null });
  return id;
}

describe("removeActivity", () => {
  it("takes a repeating activity off today and the days after, and leaves the days before today as they showed", async () => {
    await inTestDatabase(async (db) => {
      const actor = await manager(db);
      const id = await addTestActivity(db, actor.id);
      const yesterday = await shownOn(db, YESTERDAY);

      await removeActivity(db, actor, id, TODAY);

      expect(yesterday).toHaveLength(1);
      expect(await shownOn(db, YESTERDAY)).toEqual(yesterday);
      expect(await readDailyActivities(db, TODAY)).toEqual([]);
      expect(await readDailyActivities(db, "2026-11-01")).toEqual([]);
      expect(await listRoutines(db)).toEqual([]);
    });
  });

  it("marks it as removed, with who, when and from which day, and erases nothing", async () => {
    await inTestDatabase(async (db) => {
      const actor = await manager(db);
      const before = new Date();
      const id = await addAndRemove(db, actor);

      const kept = await storedActivity(db, id);
      expect(kept?.deletedBy).toBe(actor.id);
      expect(kept?.removedFrom).toBe(TODAY);
      expect(kept?.deletedAt?.getTime()).toBeGreaterThanOrEqual(
        before.getTime() - 1000,
      );
      expect(await versionsOf(db, id)).toHaveLength(1);
    });
  });

  it("takes a one-off activity of today or later off its day", async () => {
    await inTestDatabase(async (db) => {
      const actor = await manager(db);
      const id = await addTestActivity(db, actor.id, {
        versions: [{ pattern: "once", startsOn: TODAY, endsOn: TODAY }],
      });

      await removeActivity(db, actor, id, TODAY);

      expect(await readDailyActivities(db, TODAY)).toEqual([]);
      expect((await listOneOffs(db, 1)).matching).toBe(0);
    });
  });

  it("refuses a one-off activity of a day gone by, which stays as it was held", async () => {
    await inTestDatabase(async (db) => {
      const actor = await manager(db);
      const past = { pattern: "once", startsOn: YESTERDAY, endsOn: YESTERDAY };
      const id = await addTestActivity(db, actor.id, {
        versions: [{ ...past, pattern: "once" as const }],
      });

      expect(await removeActivity(db, actor, id, TODAY)).toEqual(
        ONE_OFF_IS_PAST,
      );
      expect((await storedActivity(db, id))?.deletedAt).toBeNull();
    });
  });

  it("finds no activity to remove a second time", async () => {
    await inTestDatabase(async (db) => {
      const actor = await manager(db);
      const id = await addAndRemove(db, actor);

      expect(await removeActivity(db, actor, id, TODAY)).toEqual(
        ACTIVITY_NOT_FOUND,
      );
    });
  });

  it.each(["bam_household", "bam_spiritual", "head_of_unit"] as const)(
    "refuses a hand-made removal by %s, and marks nothing",
    async (role) => {
      await inTestDatabase(async (db) => {
        const owner = await manager(db);
        const id = await addTestActivity(db, owner.id);
        const actor = await addTestActor(db, "Bukan Pengelola", [role]);

        expect(await removeActivity(db, actor, id, TODAY)).toEqual(
          ACTIVITIES_NOT_ALLOWED,
        );
        expect((await storedActivity(db, id))?.deletedAt).toBeNull();
      });
    },
  );
});

describe("restoreActivity", () => {
  it("Urungkan brings the activity back as it was, on every day it took place", async () => {
    await inTestDatabase(async (db) => {
      const actor = await manager(db);
      const id = await addTestActivity(db, actor.id);
      const today = await shownOn(db, TODAY);
      await removeActivity(db, actor, id, TODAY);

      const restored = await restoreActivity(db, actor, id);

      expect(restored).toEqual({ ok: true, value: null });
      expect(await shownOn(db, TODAY)).toEqual(today);
      expect(await listRoutines(db)).toHaveLength(1);
      const kept = await storedActivity(db, id);
      expect([kept?.deletedAt, kept?.deletedBy, kept?.removedFrom]).toEqual([
        null,
        null,
        null,
      ]);
    });
  });

  it("brings back only an activity the same account removed", async () => {
    await inTestDatabase(async (db) => {
      const actor = await manager(db);
      const other = await manager(db, "Pengelola Lain");
      const id = await addAndRemove(db, actor);

      expect(await restoreActivity(db, other, id)).toEqual(ACTIVITY_NOT_FOUND);
      expect((await storedActivity(db, id))?.deletedBy).toBe(actor.id);
    });
  });

  it("finds nothing to bring back for an activity that is not removed", async () => {
    await inTestDatabase(async (db) => {
      const actor = await manager(db);
      const id = await addTestActivity(db, actor.id);

      expect(await restoreActivity(db, actor, id)).toEqual(ACTIVITY_NOT_FOUND);
    });
  });

  it("refuses a role that may not manage the activities", async () => {
    await inTestDatabase(async (db) => {
      const actor = await manager(db);
      const id = await addAndRemove(db, actor);
      const bam = await addTestActor(db, "BAM Uji", ["bam_household"]);

      expect(await restoreActivity(db, bam, id)).toEqual(
        ACTIVITIES_NOT_ALLOWED,
      );
    });
  });
});
