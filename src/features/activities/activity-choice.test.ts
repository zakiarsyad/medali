import { describe, expect, it } from "vitest";
import { type ActivityChoice, choicesBySemester } from "./activity-choice";

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
