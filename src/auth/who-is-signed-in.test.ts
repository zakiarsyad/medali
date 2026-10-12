import { describe, expect, it } from "vitest";
import type { Account } from "./accounts";
import { type SignInFacts, whoIsSignedIn } from "./who-is-signed-in";

function account(name: string): Account {
  return {
    id: "6f1c1f8e-3b7a-4c55-9a51-2f7d3c8b9e10",
    name,
    title: null,
    unit: null,
    roles: ["mentor"],
    studyProgramId: null,
    studentId: null,
    studentProgram: null,
  };
}

const own = account("Budi Contoh");
const picked = account("Siti Contoh");
const head = account("Kepala Contoh");
const PREVIEWS = ["local", "pr-preview", "main-preview"] as const;

function facts(known: Partial<SignInFacts>): SignInFacts {
  return {
    stage: "campus",
    sessionAccount: null,
    pickedAccount: null,
    defaultAccount: null,
    ...known,
  };
}

describe("whoIsSignedIn, on the campus server", () => {
  it("is the person's own account with a valid Google session", () => {
    expect(whoIsSignedIn(facts({ sessionAccount: own }))).toEqual({
      account: own,
      way: "google",
    });
  });

  it("is nobody with only a Ganti peran cookie", () => {
    expect(whoIsSignedIn(facts({ pickedAccount: picked }))).toBeNull();
  });

  it("is nobody with an expired or unknown session, which gives no account", () => {
    const known = { pickedAccount: picked, defaultAccount: head };

    expect(whoIsSignedIn(facts(known))).toBeNull();
  });

  it("is nobody without any cookie, not Kepala Unit", () => {
    expect(whoIsSignedIn(facts({ defaultAccount: head }))).toBeNull();
  });
});

describe.each(PREVIEWS)("whoIsSignedIn, in %s", (stage) => {
  it("is the person's own account with a Google session, whatever is picked", () => {
    const known = {
      stage,
      sessionAccount: own,
      pickedAccount: picked,
      defaultAccount: head,
    };

    expect(whoIsSignedIn(facts(known))).toEqual({
      account: own,
      way: "google",
    });
  });

  it("is the picked account without a Google session", () => {
    const known = { stage, pickedAccount: picked, defaultAccount: head };

    expect(whoIsSignedIn(facts(known))).toEqual({
      account: picked,
      way: "switcher",
    });
  });

  it("is Kepala Unit when no account is picked", () => {
    expect(whoIsSignedIn(facts({ stage, defaultAccount: head }))).toEqual({
      account: head,
      way: "switcher",
    });
  });

  it("is nobody when there is no account at all", () => {
    expect(whoIsSignedIn(facts({ stage }))).toBeNull();
  });
});
