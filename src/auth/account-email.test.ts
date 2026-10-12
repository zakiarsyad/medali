import { describe, expect, it } from "vitest";
import { NOT_CAMPUS_EMAIL, parseAccountEmail } from "./account-email";

const ENDING = "@kampus.example";
const MALFORMED = "Alamat email tidak valid.";

describe("parseAccountEmail", () => {
  it("gives the address in small letters, with the spaces around it dropped", () => {
    expect(
      parseAccountEmail("  Sari.Uji@Kampus.Example ", ENDING, MALFORMED),
    ).toEqual({ ok: true, value: "sari.uji@kampus.example" });
  });

  it.each([
    ["no at sign", "sari"],
    ["no name", "@kampus.example"],
    ["no dot after the at sign", "sari@kampus"],
    ["a space inside", "sari uji@kampus.example"],
    ["two at signs", "sari@uji@kampus.example"],
    ["nothing", ""],
  ])("refuses an address with %s, in the words it is given", (_kind, text) => {
    expect(parseAccountEmail(text, ENDING, MALFORMED)).toEqual({
      ok: false,
      error: MALFORMED,
    });
  });

  it("refuses a well-formed address outside the campus once the ending is set", () => {
    expect(parseAccountEmail("sari@luar.example", ENDING, MALFORMED)).toEqual({
      ok: false,
      error: NOT_CAMPUS_EMAIL,
    });
  });

  it("takes any well-formed address while the ending is empty", () => {
    expect(parseAccountEmail("sari@luar.example", "", MALFORMED)).toEqual({
      ok: true,
      value: "sari@luar.example",
    });
  });
});
