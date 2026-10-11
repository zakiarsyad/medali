import { describe, expect, it } from "vitest";
import { ROLE_IDS, type RoleId } from "@/auth/role-ids";
import { ppksActivities } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { addPpksActivity } from "./add-ppks-activity";
import { ACTIVITIES_NOT_ALLOWED } from "./not-allowed";
import { readPpksActivities } from "./stored-ppks-activities";
import { addTestActor, SENT_PPKS_ACTIVITY } from "./test-records";

const inTestDatabase = withTestDatabase();

const MAY_MANAGE: RoleId[] = ["head_of_unit", "upk_staff"];

describe("addPpksActivity", () => {
  it.each(MAY_MANAGE)(
    "lets %s add an activity, kept with who changed it and when",
    async (role) => {
      await inTestDatabase(async (db) => {
        const actor = await addTestActor(db, "Pegawai Uji", [role]);

        const added = await addPpksActivity(db, actor, SENT_PPKS_ACTIVITY);

        expect(added).toEqual({ ok: true, value: "Kegiatan uji" });
        expect(await readPpksActivities(db)).toEqual([
          {
            id: expect.any(String),
            semester: 3,
            name: "Kegiatan uji",
            valueKeys: ["M", "D"],
            indicatorCodes: ["M2", "D2"],
            targetParticipants: 40,
            isRequired: true,
            description: "Deskripsi uji.",
          },
        ]);
        const [kept] = await db.select().from(ppksActivities);
        expect(kept?.changedBy).toBe(actor.id);
        expect(kept?.changedAt).toBeInstanceOf(Date);
      });
    },
  );

  it.each(ROLE_IDS.filter((role) => !MAY_MANAGE.includes(role)))(
    "refuses %s and adds nothing",
    async (role) => {
      await inTestDatabase(async (db) => {
        const actor = await addTestActor(db, "Pegawai Uji", [role]);

        const added = await addPpksActivity(db, actor, SENT_PPKS_ACTIVITY);

        expect(added).toEqual(ACTIVITIES_NOT_ALLOWED);
        expect(await db.select().from(ppksActivities)).toEqual([]);
      });
    },
  );

  it("adds nothing when something is missing", async () => {
    await inTestDatabase(async (db) => {
      const actor = await addTestActor(db, "Kepala Uji", ["head_of_unit"]);

      const added = await addPpksActivity(db, actor, {
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
});
