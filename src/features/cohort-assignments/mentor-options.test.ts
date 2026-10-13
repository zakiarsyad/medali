import { describe, expect, it } from "vitest";
import { mentorOptions, type PoolMentor } from "./mentor-options";

function mentor(
  id: string,
  name: string,
  unit: string | null,
  title: string | null = null,
): PoolMentor {
  return {
    id,
    name,
    unit,
    title,
    hasMentorRole: true,
    leftAsInactive: false,
    isPromised: false,
    heldCohortYears: [],
  };
}

const POOL = [
  mentor("a", "Adi Contoh", "Jurusan Akuntansi", "M.Ak."),
  mentor("b", "Budi Contoh", "Jurusan Pajak"),
  mentor("c", "Citra Contoh", null),
];

describe("mentorOptions", () => {
  it("lists the mentors of the same jurusan first and marked, each with gelar and unit", () => {
    expect(mentorOptions(POOL, "D3 Pajak", null)).toEqual([
      { id: "b", label: "Budi Contoh · Jurusan Pajak ✓" },
      { id: "a", label: "Adi Contoh, M.Ak. · Jurusan Akuntansi" },
      { id: "c", label: "Citra Contoh · -" },
    ]);
  });

  it("adds nothing for a chosen mentor who is among the choices", () => {
    const chosen = { id: "a", name: "Adi Contoh", title: "M.Ak." };

    expect(mentorOptions(POOL, "D3 Pajak", chosen)).toHaveLength(3);
  });

  it("keeps a chosen mentor who may not be chosen any more, said so, at the end", () => {
    const chosen = { id: "z", name: "Zaki Contoh", title: "S.E." };

    const options = mentorOptions(POOL, "D3 Pajak", chosen);

    expect(options).toHaveLength(4);
    expect(options.at(-1)).toEqual({
      id: "z",
      label: "Zaki Contoh, S.E. (tidak bisa dipilih lagi)",
    });
  });
});
