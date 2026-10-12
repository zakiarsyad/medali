import { describe, expect, it } from "vitest";
import { decideSignIn } from "./sign-in-decision";

const ENDING = "@kampus.example";
const ACCOUNT_ID = "6f1c1f8e-3b7a-4c55-9a51-2f7d3c8b9e10";
const CAMPUS = { email: "budi@kampus.example", verified: true };

describe("decideSignIn", () => {
  it("signs in a verified campus address that has an account", () => {
    expect(decideSignIn(CAMPUS, ENDING, ACCOUNT_ID)).toEqual({
      result: "signed_in",
      accountId: ACCOUNT_ID,
    });
  });

  it("refuses an address outside the campus, even one with an account", () => {
    const outside = { email: "orang@luar.example", verified: true };

    expect(decideSignIn(outside, ENDING, ACCOUNT_ID)).toEqual({
      result: "refused_outside_campus",
    });
  });

  it("refuses a campus address Google has not verified, like an outside one", () => {
    const unverified = { ...CAMPUS, verified: false };

    expect(decideSignIn(unverified, ENDING, ACCOUNT_ID)).toEqual({
      result: "refused_outside_campus",
    });
  });

  it("refuses every address while the campus ending is empty", () => {
    expect(decideSignIn(CAMPUS, "", ACCOUNT_ID)).toEqual({
      result: "refused_outside_campus",
    });
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
