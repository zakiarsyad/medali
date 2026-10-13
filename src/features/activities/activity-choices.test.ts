import { describe, expect, it } from "vitest";
import { withTestDatabase } from "@/db/test-database";
import { readActivityChoices } from "./activity-choices";
import { addTestActivity, addTestActor } from "./test-records";

const inTestDatabase = withTestDatabase();

describe("readActivityChoices", () => {
  it("gives the PPKS activities in the list, by semester and then by name", async () => {
    await inTestDatabase(async (db) => {
      const actor = await addTestActor(db, "Pegawai Uji Pilihan", [
        "upk_staff",
      ]);
      const fifth = await addTestActivity(db, actor.id, {
        semester: 5,
        name: "Uji pilihan A",
      });
      const laterName = await addTestActivity(db, actor.id, {
        semester: 1,
        name: "Uji pilihan C",
        targetParticipants: null,
        isRequired: false,
      });
      const earlierName = await addTestActivity(db, actor.id, {
        semester: 1,
        name: "Uji pilihan B",
      });

      const choices = await readActivityChoices(db);

      expect(choices.map((choice) => choice.id)).toEqual([
        earlierName,
        laterName,
        fifth,
      ]);
      expect(choices[1]).toEqual({
        id: laterName,
        semester: 1,
        name: "Uji pilihan C",
        valueKeys: ["M", "D"],
        indicatorCodes: ["M2", "D2"],
        targetParticipants: null,
        isRequired: false,
      });
    });
  });

  it("leaves out an activity removed from the list, and the special and additional ones", async () => {
    await inTestDatabase(async (db) => {
      const actor = await addTestActor(db, "Pegawai Uji Pilihan", [
        "upk_staff",
      ]);
      const kept = await addTestActivity(db, actor.id);
      await addTestActivity(db, actor.id, {
        name: "Uji pilihan dihapus",
        deletedAt: new Date(),
        deletedBy: actor.id,
      });
      await addTestActivity(db, actor.id, {
        semester: null,
        name: "Uji pilihan khusus",
      });

      const choices = await readActivityChoices(db);

      expect(choices.map((choice) => choice.id)).toEqual([kept]);
    });
  });
});
