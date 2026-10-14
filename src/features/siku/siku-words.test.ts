import { describe, expect, it } from "vitest";
import { basisOf } from "./siku-words";

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
