import { describe, expect, it } from "vitest";
import { ppksActivities } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { readPpksActivities } from "./stored-ppks-activities";
import { addTestActor } from "./test-records";

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
      expect(shown[1]).toEqual({ ...KEPT, id: expect.any(String) });
    });
  });
});
