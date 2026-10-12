import { describe, expect, it } from "vitest";
import {
  EMAIL_IN_USE,
  EMAIL_IN_USE_RULE,
  NOT_CAMPUS_EMAIL,
  parseAccountEmail,
  refusedWhenEmailInUse,
} from "./account-email";

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

describe("refusedWhenEmailInUse", () => {
  /** A fault shaped like the database's, for the rule of that name. */
  function refusalBy(rule: string): Error {
    return Object.assign(new Error("refused"), {
      code: "23505",
      constraint_name: rule,
    });
  }

  it("gives what the write gives when the database takes it", async () => {
    const saved = await refusedWhenEmailInUse(async () => ({
      ok: true,
      value: "saved",
    }));

    expect(saved).toEqual({ ok: true, value: "saved" });
  });

  it("says the address is used when the database's rule refuses the write", async () => {
    const saved = await refusedWhenEmailInUse(async () => {
      throw new Error("wrapped", { cause: refusalBy(EMAIL_IN_USE_RULE) });
    });

    expect(saved).toEqual({ ok: false, error: EMAIL_IN_USE });
  });

  it("hides no other fault", async () => {
    const fault = refusalBy("students_nim_unique");
    const saving = refusedWhenEmailInUse(async () => {
      throw fault;
    });

    await expect(saving).rejects.toBe(fault);
  });
});
