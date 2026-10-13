import { describe, expect, it } from "vitest";
import {
  choicesForProgram,
  type MentorCandidate,
  mayBeChosen,
  mentorsToChoose,
} from "./mentor-choices";

function mentor(
  name: string,
  more: Partial<MentorCandidate> = {},
): MentorCandidate {
  return {
    id: `id-${name}`,
    name,
    unit: "Jurusan Pajak",
    hasMentorRole: true,
    leftAsInactive: false,
    isPromised: false,
    heldCohortYears: [],
    ...more,
  };
}

describe("mayBeChosen", () => {
  it("takes a Cadangan mentor, who holds no group", () => {
    expect(mayBeChosen(mentor("Ani"), 2026)).toBe(true);
  });

  it("takes a mentor whose groups are all of this angkatan", () => {
    const busy = mentor("Ani", { heldCohortYears: [2026, 2026] });

    expect(mayBeChosen(busy, 2026)).toBe(true);
  });

  it("refuses a mentor who holds a group of another angkatan", () => {
    expect(mayBeChosen(mentor("Ani", { heldCohortYears: [2025] }), 2026)).toBe(
      false,
    );
    expect(
      mayBeChosen(mentor("Ani", { heldCohortYears: [2026, 2024] }), 2026),
    ).toBe(false);
  });

  it("refuses a Tidak aktif mentor: no group and no Pengasuh role", () => {
    expect(mayBeChosen(mentor("Ani", { hasMentorRole: false }), 2026)).toBe(
      false,
    );
  });

  it("refuses a mentor a replacement set Tidak aktif, though the role is kept", () => {
    expect(mayBeChosen(mentor("Ani", { leftAsInactive: true }), 2026)).toBe(
      false,
    );
  });

  it("refuses a mentor who is kept for a group whose replacement waits for its start date", () => {
    expect(mayBeChosen(mentor("Ani", { isPromised: true }), 2026)).toBe(false);
  });

  it("takes a mentor who lost the role and still holds groups of this angkatan only, since that one is Mengasuh", () => {
    const stillHolding = mentor("Ani", {
      hasMentorRole: false,
      heldCohortYears: [2026],
    });

    expect(mayBeChosen(stillHolding, 2026)).toBe(true);
  });
});

describe("mentorsToChoose", () => {
  it("gives the mentors that may be chosen, by name", () => {
    const mentors = [
      mentor("Dewi"),
      mentor("Budi", { heldCohortYears: [2025] }),
      mentor("Candra", { hasMentorRole: false }),
      mentor("Ani", { heldCohortYears: [2026] }),
    ];

    const names = mentorsToChoose(mentors, 2026).map((one) => one.name);

    expect(names).toEqual(["Ani", "Dewi"]);
  });

  it("does not change the list it was given", () => {
    const mentors = [mentor("Budi"), mentor("Ani")];

    mentorsToChoose(mentors, 2026);

    expect(mentors.map((one) => one.name)).toEqual(["Budi", "Ani"]);
  });
});

describe("choicesForProgram", () => {
  it("puts the mentors of the same jurusan first and marks them, each part by name", () => {
    const pool = [
      mentor("Eko", { unit: "Jurusan Akuntansi" }),
      mentor("Dewi"),
      mentor("Candra", { unit: null }),
      mentor("Budi", { unit: "Unit Pembangunan Karakter" }),
      mentor("Ani"),
    ];

    const choices = choicesForProgram(pool, "D3 Pajak");

    expect(
      choices.map((choice) => [choice.mentor.name, choice.isSameJurusan]),
    ).toEqual([
      ["Ani", true],
      ["Dewi", true],
      ["Budi", false],
      ["Candra", false],
      ["Eko", false],
    ]);
  });

  it("works out the jurusan from the name of the program studi", () => {
    const pool = [mentor("Ani"), mentor("Budi", { unit: "Jurusan Akuntansi" })];

    const [first] = choicesForProgram(pool, "Akuntansi Sektor Publik STR");

    expect(first?.mentor.name).toBe("Budi");
    expect(first?.isSameJurusan).toBe(true);
  });
});
