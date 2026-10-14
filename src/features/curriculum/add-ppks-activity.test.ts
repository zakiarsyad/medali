import { describe, expect, it } from "vitest";
import { ROLE_IDS, type RoleId } from "@/auth/role-ids";
import { ppksActivities } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { ACTIVITY_ALREADY_SENT, addPpksActivity } from "./add-ppks-activity";
import { ACTIVITIES_NOT_ALLOWED } from "./not-allowed";
import { readPpksActivities } from "./stored-ppks-activities";
import {
  addTestActor,
  NEW_ACTIVITY_ID,
  SENT_PPKS_ACTIVITY,
  SENT_SPECIAL_ACTIVITY,
} from "./test-records";

const inTestDatabase = withTestDatabase();

const MAY_MANAGE: RoleId[] = ["head_of_unit", "upk_staff"];
const MAY_NOT_MANAGE = ROLE_IDS.filter((role) => !MAY_MANAGE.includes(role));
const ADDED = { ok: true, value: "Kegiatan uji" };

describe("addPpksActivity", () => {
  it.each(MAY_MANAGE)(
    "lets %s add an activity, kept with who changed it and when",
    async (role) => {
      await inTestDatabase(async (db) => {
        const actor = await addTestActor(db, "Pegawai Uji", [role]);

        const added = await addPpksActivity(
          db,
          actor,
          NEW_ACTIVITY_ID,
          SENT_PPKS_ACTIVITY,
        );

        expect(added).toEqual(ADDED);
        expect(await readPpksActivities(db)).toEqual([
          {
            id: NEW_ACTIVITY_ID,
            semester: 3,
            name: "Kegiatan uji",
            valueKeys: ["M", "D"],
            indicatorCodes: ["M2", "D2"],
            targetParticipants: 40,
            isRequired: true,
            description: "Deskripsi uji.",
            version: expect.any(String),
            scheduledCount: 0,
          },
        ]);
        const [kept] = await db.select().from(ppksActivities);
        expect(kept?.changedBy).toBe(actor.id);
        expect(kept?.changedAt).toBeInstanceOf(Date);
      });
    },
  );

  it.each(MAY_MANAGE)(
    "lets %s add a special or additional activity, kept with no semester",
    async (role) => {
      await inTestDatabase(async (db) => {
        const actor = await addTestActor(db, "Pegawai Uji", [role]);

        const added = await addPpksActivity(
          db,
          actor,
          NEW_ACTIVITY_ID,
          SENT_SPECIAL_ACTIVITY,
        );

        expect(added).toEqual(ADDED);
        const [kept] = await db.select().from(ppksActivities);
        expect(kept?.semester).toBeNull();
        expect(kept?.name).toBe("Kegiatan uji");
        expect(kept?.changedBy).toBe(actor.id);
      });
    },
  );

  it.each(MAY_NOT_MANAGE)("refuses %s and adds nothing", async (role) => {
    await inTestDatabase(async (db) => {
      const actor = await addTestActor(db, "Pegawai Uji", [role]);

      for (const sent of [SENT_PPKS_ACTIVITY, SENT_SPECIAL_ACTIVITY]) {
        const added = await addPpksActivity(db, actor, NEW_ACTIVITY_ID, sent);
        expect(added).toEqual(ACTIVITIES_NOT_ALLOWED);
      }
      expect(await db.select().from(ppksActivities)).toEqual([]);
    });
  });

  it("adds nothing when something is missing", async () => {
    await inTestDatabase(async (db) => {
      const actor = await addTestActor(db, "Kepala Uji", ["head_of_unit"]);

      const added = await addPpksActivity(db, actor, NEW_ACTIVITY_ID, {
        ...SENT_PPKS_ACTIVITY,
        indicatorCodes: [],
      });

      expect(added).toEqual({
        ok: false,
        error: "Pilih minimal satu indikator utama.",
      });
      expect(await db.select().from(ppksActivities)).toEqual([]);
    });
  });

  it.each([SENT_PPKS_ACTIVITY, SENT_SPECIAL_ACTIVITY])(
    "keeps a form sent twice once, and answers the same both times",
    async (sent) => {
      await inTestDatabase(async (db) => {
        const actor = await addTestActor(db, "Pegawai Uji", ["upk_staff"]);

        const first = await addPpksActivity(db, actor, NEW_ACTIVITY_ID, sent);
        const second = await addPpksActivity(db, actor, NEW_ACTIVITY_ID, sent);

        expect(first).toEqual(ADDED);
        expect(second).toEqual(ADDED);
        expect(await db.select().from(ppksActivities)).toHaveLength(1);
      });
    },
  );

  it("refuses a key whose activity holds other words, and keeps that activity", async () => {
    await inTestDatabase(async (db) => {
      const actor = await addTestActor(db, "Pegawai Uji", ["upk_staff"]);
      await addPpksActivity(db, actor, NEW_ACTIVITY_ID, SENT_PPKS_ACTIVITY);

      const again = await addPpksActivity(db, actor, NEW_ACTIVITY_ID, {
        ...SENT_PPKS_ACTIVITY,
        name: "Kegiatan uji lain",
      });

      expect(again).toEqual(ACTIVITY_ALREADY_SENT);
      const kept = await db.select().from(ppksActivities);
      expect(kept.map(({ name }) => name)).toEqual(["Kegiatan uji"]);
    });
  });

  it("refuses a key whose activity is of another kind", async () => {
    await inTestDatabase(async (db) => {
      const actor = await addTestActor(db, "Pegawai Uji", ["upk_staff"]);
      await addPpksActivity(db, actor, NEW_ACTIVITY_ID, SENT_PPKS_ACTIVITY);

      const again = await addPpksActivity(
        db,
        actor,
        NEW_ACTIVITY_ID,
        SENT_SPECIAL_ACTIVITY,
      );

      expect(again).toEqual(ACTIVITY_ALREADY_SENT);
      const [kept] = await db.select().from(ppksActivities);
      expect(kept?.semester).toBe(3);
    });
  });

  it("refuses a key of an activity another account added", async () => {
    await inTestDatabase(async (db) => {
      const first = await addTestActor(db, "Pegawai Uji", ["upk_staff"]);
      const other = await addTestActor(db, "Kepala Uji", ["head_of_unit"]);
      await addPpksActivity(db, first, NEW_ACTIVITY_ID, SENT_PPKS_ACTIVITY);

      const again = await addPpksActivity(
        db,
        other,
        NEW_ACTIVITY_ID,
        SENT_PPKS_ACTIVITY,
      );

      expect(again).toEqual(ACTIVITY_ALREADY_SENT);
      const [kept] = await db.select().from(ppksActivities);
      expect(kept?.changedBy).toBe(first.id);
    });
  });

  it.each(["", "bukan-kunci"])(
    "refuses the key '%s' and adds nothing",
    async (id) => {
      await inTestDatabase(async (db) => {
        const actor = await addTestActor(db, "Pegawai Uji", ["upk_staff"]);

        const added = await addPpksActivity(db, actor, id, SENT_PPKS_ACTIVITY);

        expect(added).toEqual(ACTIVITY_ALREADY_SENT);
        expect(await db.select().from(ppksActivities)).toEqual([]);
      });
    },
  );
});
