import { describe, expect, it } from "vitest";
import { spareChoices } from "./spare-choices";
import type { SpareMentor } from "./spare-mentors";

function spare(name: string, unit: string | null): SpareMentor {
  return { id: `id-${name}`, name, title: null, unit };
}

const SPARES = [
  spare("Ani", "Jurusan Akuntansi"),
  spare("Budi", "Jurusan Pajak"),
  spare("Candra", null),
  spare("Dewi", "Jurusan Pajak"),
];

describe("spareChoices", () => {
  it("puts the spare mentors of the same unit first and marks them", () => {
    const labels = spareChoices(SPARES, "Jurusan Pajak").map(
      (choice) => choice.label,
    );

    expect(labels).toEqual([
      "Budi · Jurusan Pajak (unit sama)",
      "Dewi · Jurusan Pajak (unit sama)",
      "Ani · Jurusan Akuntansi",
      "Candra · -",
    ]);
  });

  it("marks nobody when the unit of the mentor who leaves is not kept", () => {
    const choices = spareChoices(SPARES, null);

    expect(choices.map((choice) => choice.name)).toEqual([
      "Ani",
      "Budi",
      "Candra",
      "Dewi",
    ]);
    expect(choices.some((choice) => choice.label.includes("unit sama"))).toBe(
      false,
    );
  });

  it("names a mentor with the gelar in the choice, and without it for the sentence", () => {
    const withTitle = { ...spare("Eko", "Jurusan Pajak"), title: "M.Si." };

    expect(spareChoices([withTitle], null)).toEqual([
      { id: "id-Eko", name: "Eko", label: "Eko, M.Si. · Jurusan Pajak" },
    ]);
  });

  it("is empty when there is no spare mentor", () => {
    expect(spareChoices([], "Jurusan Pajak")).toEqual([]);
  });
});
