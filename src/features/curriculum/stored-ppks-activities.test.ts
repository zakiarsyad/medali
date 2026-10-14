// Sample Tahun akademik of this file: 2810 to 2810.
import { describe, expect, it } from "vitest";
import { ppksActivities } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { readPpksActivities } from "./stored-ppks-activities";
import { addTestActor, addTestPeriod, addTestSchedule } from "./test-records";

const inTestDatabase = withTestDatabase();

const KEPT = {
  semester: 3,
  name: "Kegiatan uji",
  valueKeys: ["M" as const, "D" as const],
  indicatorCodes: ["M2", "D2"],
  targetParticipants: null,
  isRequired: false,
  description: "Deskripsi uji.",
};

describe("readPpksActivities", () => {
  it("gives nothing while no activity is kept", async () => {
    await inTestDatabase(async (db) => {
      expect(await readPpksActivities(db)).toEqual([]);
    });
  });

  it("gives the kept activities by name, without the removed ones", async () => {
    await inTestDatabase(async (db) => {
      const actor = await addTestActor(db, "Pegawai Uji", ["upk_staff"]);
      const changed = { changedAt: new Date(), changedBy: actor.id };
      await db.insert(ppksActivities).values([
        { ...KEPT, ...changed },
        { ...KEPT, ...changed, name: "Aktivitas uji", semester: 8 },
        {
          ...KEPT,
          ...changed,
          name: "Kegiatan uji terhapus",
          deletedAt: new Date(),
          deletedBy: actor.id,
        },
      ]);

      const shown = await readPpksActivities(db);

      expect(shown.map(({ name }) => name)).toEqual([
        "Aktivitas uji",
        "Kegiatan uji",
      ]);
      expect(shown[1]).toEqual({
        ...KEPT,
        id: expect.any(String),
        version: changed.changedAt.toISOString(),
        scheduledCount: 0,
      });
    });
  });

  it("gives a special or additional activity with no semester", async () => {
    await inTestDatabase(async (db) => {
      const actor = await addTestActor(db, "Pegawai Uji", ["upk_staff"]);
      await db.insert(ppksActivities).values({
        ...KEPT,
        semester: null,
        changedAt: new Date(),
        changedBy: actor.id,
      });

      const [shown] = await readPpksActivities(db);

      expect(shown?.semester).toBeNull();
    });
  });

  it("counts the schedules of each activity that are not removed", async () => {
    await inTestDatabase(async (db) => {
      const actor = await addTestActor(db, "Pegawai Uji", ["upk_staff"]);
      const changed = { changedAt: new Date(), changedBy: actor.id };
      const [often, once, never] = await db
        .insert(ppksActivities)
        .values([
          { ...KEPT, ...changed, name: "A sering" },
          { ...KEPT, ...changed, name: "B sekali", semester: null },
          { ...KEPT, ...changed, name: "C belum" },
        ])
        .returning({ id: ppksActivities.id });
      if (!often || !once || !never) throw new Error("Not added.");
      const periodId = await addTestPeriod(db, 2810);
      const actorId = actor.id;
      for (const activityId of [often.id, often.id, often.id, once.id]) {
        await addTestSchedule(db, { activityId, periodId, actorId });
      }
      for (const activityId of [once.id, never.id]) {
        await addTestSchedule(db, {
          activityId,
          periodId,
          actorId,
          isRemoved: true,
        });
      }

      const shown = await readPpksActivities(db);

      expect(shown.map((activity) => activity.scheduledCount)).toEqual([
        3, 1, 0,
      ]);
    });
  });
});
