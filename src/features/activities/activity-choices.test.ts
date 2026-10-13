import { describe, expect, it } from "vitest";
import { withTestDatabase } from "@/db/test-database";
import {
  type ActivityChoice,
  choicesBySemester,
  readActivityChoices,
} from "./activity-choices";
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

describe("choicesBySemester", () => {
  function choice(id: string, semester: number): ActivityChoice {
    return {
      id,
      semester,
      name: `Kegiatan ${id}`,
      valueKeys: ["M"],
      indicatorCodes: ["M1"],
      targetParticipants: null,
      isRequired: true,
    };
  }

  it("groups the choices by semester, in semester order, with no empty group", () => {
    const grouped = choicesBySemester([
      choice("c", 5),
      choice("a", 1),
      choice("b", 1),
    ]);

    expect([...grouped.keys()]).toEqual([1, 5]);
    expect(grouped.get(1)?.map((each) => each.id)).toEqual(["a", "b"]);
    expect(grouped.get(5)?.map((each) => each.id)).toEqual(["c"]);
  });

  it("gives no group for no choices", () => {
    expect(choicesBySemester([]).size).toBe(0);
  });
});
