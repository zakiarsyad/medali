import { describe, expect, it } from "vitest";
import { basisOf, sikuNote } from "./siku-words";

describe("basisOf", () => {
  it("names a gain an approved request made as Pengajuan mahasiswa", () => {
    expect(basisOf({ basis: "", fromRequest: true })).toBe(
      "Pengajuan mahasiswa",
    );
  });

  it("gives the letter of a decision, and nothing for any other entry", () => {
    expect(basisOf({ basis: "SK-01", fromRequest: false })).toBe("SK-01");
    expect(basisOf({ basis: "", fromRequest: false })).toBe("");
  });
});

describe("sikuNote", () => {
  it("says SIKU dasar for a student with no entry in force", () => {
    expect(sikuNote(65, { gains: 0, losses: 0 })).toBe("SIKU dasar 65");
  });

  it("gives the gains and the losses beside Nilai dasar", () => {
    expect(sikuNote(65, { gains: 5, losses: 3 })).toBe("SIKU 65 +5 / −3");
    expect(sikuNote(65, { gains: 0, losses: 2 })).toBe("SIKU 65 −2");
    expect(sikuNote(65, { gains: 4, losses: 0 })).toBe("SIKU 65 +4");
  });
});
