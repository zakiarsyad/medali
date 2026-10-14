import { describe, expect, it } from "vitest";
import { dormActivities, dormActivityVersions } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { listOneOffs, listRoutines } from "./activity-lists";
import {
  ACTIVITIES_NOT_ALLOWED,
  ACTIVITY_ALREADY_SENT,
} from "./activity-messages";
import { addActivity } from "./add-activity";
import { readDailyActivities } from "./daily-activities";
import {
  daysOffOf,
  NEW_ACTIVITY_ID,
  SENT_ONE_OFF,
  SENT_ROUTINE,
} from "./test-activities";
import { addTestActor } from "./test-records";

const inTestDatabase = withTestDatabase();

describe("addActivity", () => {
  it("adds a repeating activity with its days off, shown on every day it takes place, past days among them", async () => {
    await inTestDatabase(async (db) => {
      const manager = await addTestActor(db, "Pengelola Tambah", [
        "dorm_manager",
      ]);
      const sent = {
        ...SENT_ROUTINE,
        pattern: "weekly",
        weekdays: ["3"],
        daysOff: ["2026-10-21"],
      };

      const added = await addActivity(db, manager, NEW_ACTIVITY_ID, sent);

      expect(added).toMatchObject({
        ok: true,
        value: { name: "Apel pagi uji" },
      });
      const [kept] = await db.select().from(dormActivities);
      expect(kept).toMatchObject({
        id: NEW_ACTIVITY_ID,
        changedBy: manager.id,
      });
      expect(await daysOffOf(db, NEW_ACTIVITY_ID)).toEqual(["2026-10-21"]);
      expect(await readDailyActivities(db, "2026-08-05")).toHaveLength(1);
      expect(await readDailyActivities(db, "2026-10-14")).toHaveLength(1);
      expect(await readDailyActivities(db, "2026-10-15")).toHaveLength(0);
      expect(await readDailyActivities(db, "2026-10-21")).toHaveLength(0);
      expect(await readDailyActivities(db, "2026-10-28")).toHaveLength(1);
    });
  });

  it("adds a one-off activity to Kegiatan non rutin and to its day only", async () => {
    await inTestDatabase(async (db) => {
      const manager = await addTestActor(db, "Pengelola Sekali", [
        "dorm_manager",
      ]);

      await addActivity(db, manager, NEW_ACTIVITY_ID, SENT_ONE_OFF);

      expect((await listOneOffs(db, 1)).matching).toBe(1);
      expect(await listRoutines(db)).toEqual([]);
      expect(await readDailyActivities(db, "2026-10-20")).toHaveLength(1);
      expect(await readDailyActivities(db, "2026-10-21")).toHaveLength(0);
    });
  });

  it("saves nothing for a form with a fault in it", async () => {
    await inTestDatabase(async (db) => {
      const manager = await addTestActor(db, "Pengelola Salah", [
        "dorm_manager",
      ]);

      const added = await addActivity(db, manager, NEW_ACTIVITY_ID, {
        ...SENT_ROUTINE,
        name: "Ab",
      });

      expect(added).toEqual({
        ok: false,
        error: "Nama kegiatan paling sedikit 3 huruf.",
      });
      expect(await db.select().from(dormActivities)).toEqual([]);
    });
  });

  it("saves one activity for a form sent twice, and answers both as saved", async () => {
    await inTestDatabase(async (db) => {
      const manager = await addTestActor(db, "Pengelola Dua", ["dorm_manager"]);

      const first = await addActivity(
        db,
        manager,
        NEW_ACTIVITY_ID,
        SENT_ROUTINE,
      );
      const second = await addActivity(
        db,
        manager,
        NEW_ACTIVITY_ID,
        SENT_ROUTINE,
      );

      expect(second).toEqual(first);
      expect(first.ok).toBe(true);
      expect(await db.select().from(dormActivityVersions)).toHaveLength(1);
    });
  });

  it("refuses the same key sent again with other content, or by another account", async () => {
    await inTestDatabase(async (db) => {
      const manager = await addTestActor(db, "Pengelola Satu", [
        "dorm_manager",
      ]);
      const other = await addTestActor(db, "Pengelola Lain", ["dorm_manager"]);
      await addActivity(db, manager, NEW_ACTIVITY_ID, SENT_ROUTINE);

      const changed = await addActivity(db, manager, NEW_ACTIVITY_ID, {
        ...SENT_ROUTINE,
        location: "Tempat lain",
      });
      const byOther = await addActivity(
        db,
        other,
        NEW_ACTIVITY_ID,
        SENT_ROUTINE,
      );

      expect(changed).toEqual(ACTIVITY_ALREADY_SENT);
      expect(byOther).toEqual(ACTIVITY_ALREADY_SENT);
      const [kept] = await db.select().from(dormActivityVersions);
      expect(kept?.location).toBe("Lapangan uji");
    });
  });

  it("refuses a key the form did not make", async () => {
    await inTestDatabase(async (db) => {
      const manager = await addTestActor(db, "Pengelola Kunci", [
        "dorm_manager",
      ]);

      expect(await addActivity(db, manager, "satu", SENT_ROUTINE)).toEqual(
        ACTIVITY_ALREADY_SENT,
      );
    });
  });

  it.each(["bam_household", "bam_bphk", "head_of_unit", "student"] as const)(
    "refuses %s, who may not manage the activities, and saves nothing",
    async (role) => {
      await inTestDatabase(async (db) => {
        const actor = await addTestActor(db, "Bukan Pengelola", [role]);

        const added = await addActivity(
          db,
          actor,
          NEW_ACTIVITY_ID,
          SENT_ROUTINE,
        );

        expect(added).toEqual(ACTIVITIES_NOT_ALLOWED);
        expect(await db.select().from(dormActivities)).toEqual([]);
      });
    },
  );
});
