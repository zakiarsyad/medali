import { describe, expect, it } from "vitest";
import { decideSignIn } from "./sign-in-decision";

const ENDING = "@kampus.example";
const ACCOUNT_ID = "6f1c1f8e-3b7a-4c55-9a51-2f7d3c8b9e10";
const CAMPUS = {
  email: "budi@kampus.example",
  verified: true,
  hostedDomain: "kampus.example",
};
const OUTSIDE = { result: "refused_outside_campus" };

describe("decideSignIn", () => {
  it("signs in a verified campus address that has an account", () => {
    expect(decideSignIn(CAMPUS, ENDING, ACCOUNT_ID)).toEqual({
      result: "signed_in",
      accountId: ACCOUNT_ID,
    });
  });

  it("refuses an address outside the campus, even one with an account", () => {
    const outside = { ...CAMPUS, email: "orang@luar.example" };

    expect(decideSignIn(outside, ENDING, ACCOUNT_ID)).toEqual(OUTSIDE);
  });

  it("refuses a campus address Google has not verified, like an outside one", () => {
    const unverified = { ...CAMPUS, verified: false };

    expect(decideSignIn(unverified, ENDING, ACCOUNT_ID)).toEqual(OUTSIDE);
  });

  it.each([
    ["no campus named by Google, as for a personal account", null],
    ["another campus named by Google", "luar.example"],
    ["a longer name than the campus", "mail.kampus.example"],
    ["the ending with its @", "@kampus.example"],
    ["an empty name", ""],
  ])(
    "refuses a campus address with %s, like an outside one",
    (_kind, hostedDomain) => {
      const personal = { ...CAMPUS, hostedDomain };

      expect(decideSignIn(personal, ENDING, ACCOUNT_ID)).toEqual(OUTSIDE);
    },
  );

  it("refuses every address while the campus ending is empty", () => {
    expect(decideSignIn(CAMPUS, "", ACCOUNT_ID)).toEqual(OUTSIDE);
    expect(
      decideSignIn({ ...CAMPUS, hostedDomain: "" }, "", ACCOUNT_ID),
    ).toEqual(OUTSIDE);
  });

  it("refuses a campus address that has no account", () => {
    expect(decideSignIn(CAMPUS, ENDING, null)).toEqual({
      result: "refused_no_account",
    });
  });

  it("fails when Google gave no answer that can be trusted", () => {
    expect(decideSignIn(null, ENDING, ACCOUNT_ID)).toEqual({
      result: "failed",
    });
  });
});
