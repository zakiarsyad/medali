import { describe, expect, it } from "vitest";
import { ROLE_IDS, type RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { ppksActivities } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { addPpksActivity } from "./add-ppks-activity";
import { ACTIVITY_NOT_FOUND, removePpksActivity } from "./change-ppks-activity";
import { ACTIVITIES_NOT_ALLOWED } from "./not-allowed";
import type { SentPpksActivity } from "./ppks-activity-input";
import { restorePpksActivity } from "./restore-ppks-activity";
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
const BOTH_KINDS = [SENT_PPKS_ACTIVITY, SENT_SPECIAL_ACTIVITY];
const UNKNOWN_ID = "3f2b8c1e-9a4d-4e7b-8c1a-0d5e6f7a8b9c";
const ID = NEW_ACTIVITY_ID;

/** Adds the activity of the checks, removed by the account with that role. */
async function addRemoved(
  db: Database,
  sent: SentPpksActivity,
  role: RoleId = "upk_staff",
) {
  const remover = await addTestActor(db, "Pegawai Uji", [role]);
  await addPpksActivity(db, remover, ID, sent);
  await removePpksActivity(db, remover, ID);
  return remover;
}

describe("restorePpksActivity", () => {
  it.each(MAY_MANAGE)(
    "lets %s bring back an activity they removed, as it was",
    async (role) => {
      await inTestDatabase(async (db) => {
        for (const sent of BOTH_KINDS) {
          await db.delete(ppksActivities);
          const adder = await addTestActor(db, "Kepala Uji", ["head_of_unit"]);
          await addPpksActivity(db, adder, ID, sent);
          const before = await readPpksActivities(db);
          const remover = await addTestActor(db, "Pegawai Uji", [role]);
          await removePpksActivity(db, remover, ID);

          const restored = await restorePpksActivity(db, remover, ID);

          expect(restored).toEqual({ ok: true, value: null });
          expect(await readPpksActivities(db)).toEqual(before);
          const [kept] = await db.select().from(ppksActivities);
          expect(kept?.deletedAt).toBeNull();
          expect(kept?.deletedBy).toBeNull();
          expect(kept?.changedBy).toBe(adder.id);
        }
      });
    },
  );

  it.each(MAY_NOT_MANAGE)(
    "refuses %s, and the activity stays removed",
    async (role) => {
      await inTestDatabase(async (db) => {
        for (const sent of BOTH_KINDS) {
          await db.delete(ppksActivities);
          const remover = await addRemoved(db, sent);
          // The account that removed it, now without the right.
          const actor = { id: remover.id, roles: [role] };

          const restored = await restorePpksActivity(db, actor, ID);

          expect(restored).toEqual(ACTIVITIES_NOT_ALLOWED);
          expect(await readPpksActivities(db)).toEqual([]);
        }
      });
    },
  );

  it("does not bring back an activity someone else removed", async () => {
    await inTestDatabase(async (db) => {
      const remover = await addRemoved(db, SENT_SPECIAL_ACTIVITY);
      const other = await addTestActor(db, "Kepala Dua", ["head_of_unit"]);

      const restored = await restorePpksActivity(db, other, ID);

      expect(restored).toEqual(ACTIVITY_NOT_FOUND);
      expect(await readPpksActivities(db)).toEqual([]);
      const [kept] = await db.select().from(ppksActivities);
      expect(kept?.deletedBy).toBe(remover.id);
    });
  });

  it("finds no activity to bring back when it is not removed", async () => {
    await inTestDatabase(async (db) => {
      const actor = await addTestActor(db, "Pegawai Uji", ["upk_staff"]);
      await addPpksActivity(db, actor, ID, SENT_SPECIAL_ACTIVITY);

      expect(await restorePpksActivity(db, actor, ID)).toEqual(
        ACTIVITY_NOT_FOUND,
      );
      expect(await readPpksActivities(db)).toHaveLength(1);
    });
  });

  it.each([UNKNOWN_ID, "", "bukan-id"])(
    "finds no activity with the id '%s'",
    async (id) => {
      await inTestDatabase(async (db) => {
        const remover = await addRemoved(db, SENT_SPECIAL_ACTIVITY);

        expect(await restorePpksActivity(db, remover, id)).toEqual(
          ACTIVITY_NOT_FOUND,
        );
        expect(await readPpksActivities(db)).toEqual([]);
      });
    },
  );
});
