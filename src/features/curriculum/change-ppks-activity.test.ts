import { describe, expect, it } from "vitest";
import { ROLE_IDS, type RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { ppksActivities } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { addPpksActivity } from "./add-ppks-activity";
import {
  ACTIVITY_NOT_FOUND,
  changePpksActivity,
  removePpksActivity,
} from "./change-ppks-activity";
import { ACTIVITIES_NOT_ALLOWED } from "./not-allowed";
import type { SentPpksActivity } from "./ppks-activity-input";
import { readPpksActivities } from "./stored-ppks-activities";
import {
  addTestActor,
  NEW_ACTIVITY_ID,
  SENT_PPKS_ACTIVITY,
  SENT_SPECIAL_ACTIVITY,
} from "./test-records";

const inTestDatabase = withTestDatabase();

const MAY_MANAGE: RoleId[] = ["head_of_unit", "upk_staff"];
const UNKNOWN_ID = "3f2b8c1e-9a4d-4e7b-8c1a-0d5e6f7a8b9c";
const CHANGED = {
  ...SENT_PPKS_ACTIVITY,
  name: "Kegiatan uji baru",
  valueKeys: ["I"],
  indicatorCodes: ["I2"],
  target: "",
  isRequired: false,
  description: "",
};

/** Adds the activity of the checks as a made-up Kepala Unit; gives its id. */
async function addKept(
  db: Database,
  sent: SentPpksActivity = SENT_PPKS_ACTIVITY,
): Promise<string> {
  const adder = await addTestActor(db, "Kepala Uji", ["head_of_unit"]);
  await addPpksActivity(db, adder, NEW_ACTIVITY_ID, sent);
  return NEW_ACTIVITY_ID;
}

describe("changePpksActivity", () => {
  it.each(MAY_MANAGE)(
    "lets %s change an activity, kept with who changed it last",
    async (role) => {
      await inTestDatabase(async (db) => {
        const id = await addKept(db);
        const actor = await addTestActor(db, "Pegawai Uji", [role]);

        const changed = await changePpksActivity(db, actor, id, CHANGED);

        expect(changed).toEqual({ ok: true, value: "Kegiatan uji baru" });
        expect(await readPpksActivities(db)).toEqual([
          {
            id,
            semester: 3,
            name: "Kegiatan uji baru",
            valueKeys: ["I"],
            indicatorCodes: ["I2"],
            targetParticipants: null,
            isRequired: false,
            description: "",
            version: expect.any(String),
          },
        ]);
        const [kept] = await db.select().from(ppksActivities);
        expect(kept?.changedBy).toBe(actor.id);
      });
    },
  );

  it.each(ROLE_IDS.filter((role) => !MAY_MANAGE.includes(role)))(
    "refuses %s and changes nothing",
    async (role) => {
      await inTestDatabase(async (db) => {
        const id = await addKept(db);
        const actor = await addTestActor(db, "Pegawai Uji", [role]);

        const changed = await changePpksActivity(db, actor, id, CHANGED);

        expect(changed).toEqual(ACTIVITIES_NOT_ALLOWED);
        const [kept] = await readPpksActivities(db);
        expect(kept?.name).toBe("Kegiatan uji");
      });
    },
  );

  it("changes nothing when something is missing", async () => {
    await inTestDatabase(async (db) => {
      const id = await addKept(db);
      const actor = await addTestActor(db, "Pegawai Uji", ["upk_staff"]);

      const changed = await changePpksActivity(db, actor, id, {
        ...CHANGED,
        valueKeys: [],
      });

      expect(changed).toEqual({
        ok: false,
        error: "Pilih minimal satu nilai MEDALI.",
      });
      const [kept] = await readPpksActivities(db);
      expect(kept?.name).toBe("Kegiatan uji");
    });
  });

  it.each([UNKNOWN_ID, "", "bukan-id"])(
    "finds no activity with the id '%s'",
    async (id) => {
      await inTestDatabase(async (db) => {
        await addKept(db);
        const actor = await addTestActor(db, "Pegawai Uji", ["upk_staff"]);

        const changed = await changePpksActivity(db, actor, id, CHANGED);

        expect(changed).toEqual(ACTIVITY_NOT_FOUND);
      });
    },
  );

  it("does not move an activity to another semester", async () => {
    await inTestDatabase(async (db) => {
      const id = await addKept(db);
      const actor = await addTestActor(db, "Pegawai Uji", ["upk_staff"]);

      const changed = await changePpksActivity(db, actor, id, {
        ...CHANGED,
        semester: "4",
      });

      expect(changed).toEqual(ACTIVITY_NOT_FOUND);
      const [kept] = await readPpksActivities(db);
      expect(kept?.semester).toBe(3);
      expect(kept?.name).toBe("Kegiatan uji");
    });
  });

  it("does not make a PPKS activity a special one", async () => {
    await inTestDatabase(async (db) => {
      const id = await addKept(db);
      const actor = await addTestActor(db, "Pegawai Uji", ["upk_staff"]);

      const changed = await changePpksActivity(db, actor, id, {
        ...CHANGED,
        semester: "",
      });

      expect(changed).toEqual(ACTIVITY_NOT_FOUND);
      const [kept] = await readPpksActivities(db);
      expect(kept?.semester).toBe(3);
      expect(kept?.name).toBe("Kegiatan uji");
    });
  });

  it("does not move a special activity to a semester", async () => {
    await inTestDatabase(async (db) => {
      const id = await addKept(db, SENT_SPECIAL_ACTIVITY);
      const actor = await addTestActor(db, "Pegawai Uji", ["upk_staff"]);

      const changed = await changePpksActivity(db, actor, id, CHANGED);

      expect(changed).toEqual(ACTIVITY_NOT_FOUND);
      const [kept] = await readPpksActivities(db);
      expect(kept?.semester).toBeNull();
      expect(kept?.name).toBe("Kegiatan uji");
    });
  });
});

describe("removePpksActivity", () => {
  it.each(MAY_MANAGE)(
    "lets %s remove an activity, kept as a mark with who and when",
    async (role) => {
      await inTestDatabase(async (db) => {
        const id = await addKept(db);
        const actor = await addTestActor(db, "Pegawai Uji", [role]);

        const removed = await removePpksActivity(db, actor, id);

        expect(removed).toEqual({ ok: true, value: null });
        expect(await readPpksActivities(db)).toEqual([]);
        const [kept] = await db.select().from(ppksActivities);
        expect(kept?.id).toBe(id);
        expect(kept?.deletedBy).toBe(actor.id);
        expect(kept?.deletedAt).toBeInstanceOf(Date);
      });
    },
  );

  it.each(ROLE_IDS.filter((role) => !MAY_MANAGE.includes(role)))(
    "refuses %s and removes nothing",
    async (role) => {
      await inTestDatabase(async (db) => {
        const id = await addKept(db);
        const actor = await addTestActor(db, "Pegawai Uji", [role]);

        const removed = await removePpksActivity(db, actor, id);

        expect(removed).toEqual(ACTIVITIES_NOT_ALLOWED);
        expect(await readPpksActivities(db)).toHaveLength(1);
      });
    },
  );

  it.each([UNKNOWN_ID, "", "bukan-id"])(
    "finds no activity with the id '%s'",
    async (id) => {
      await inTestDatabase(async (db) => {
        await addKept(db);
        const actor = await addTestActor(db, "Pegawai Uji", ["upk_staff"]);

        expect(await removePpksActivity(db, actor, id)).toEqual(
          ACTIVITY_NOT_FOUND,
        );
        expect(await readPpksActivities(db)).toHaveLength(1);
      });
    },
  );

  it("keeps the first mark of an activity that is already removed", async () => {
    await inTestDatabase(async (db) => {
      const id = await addKept(db);
      const first = await addTestActor(db, "Pegawai Uji", ["upk_staff"]);
      const second = await addTestActor(db, "Kepala Uji Dua", ["head_of_unit"]);
      await removePpksActivity(db, first, id);

      expect(await removePpksActivity(db, second, id)).toEqual(
        ACTIVITY_NOT_FOUND,
      );
      const [kept] = await db.select().from(ppksActivities);
      expect(kept?.deletedBy).toBe(first.id);
    });
  });

  it("refuses a change to an activity that is removed", async () => {
    await inTestDatabase(async (db) => {
      const id = await addKept(db);
      const actor = await addTestActor(db, "Pegawai Uji", ["upk_staff"]);
      await removePpksActivity(db, actor, id);

      expect(await changePpksActivity(db, actor, id, CHANGED)).toEqual(
        ACTIVITY_NOT_FOUND,
      );
    });
  });
});
