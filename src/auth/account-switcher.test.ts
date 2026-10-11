import { describe, expect, it } from "vitest";
import { accountSwitcherOn, checkSwitcherAtStartup } from "./account-switcher";

describe("accountSwitcherOn", () => {
  it("is off on the campus server", () => {
    expect(accountSwitcherOn("campus")).toBe(false);
  });

  it.each(["local", "pr-preview", "main-preview"] as const)(
    "is on in %s",
    (stage) => {
      expect(accountSwitcherOn(stage)).toBe(true);
    },
  );
});

describe("checkSwitcherAtStartup", () => {
  const LOCAL_DB = "postgres://medali@localhost:5432/medali";

  it.each([
    [{ VERCEL_ENV: "production" }, "a main preview not on Vercel"],
    [{ VERCEL_ENV: "preview" }, "a PR preview not on Vercel"],
    [
      {
        NODE_ENV: "development",
        DATABASE_URL: "postgres://u@db.example.com/x",
      },
      "a local run with a remote database",
    ],
    [{ NODE_ENV: "development" }, "a local run with no database setting"],
    [
      { NODE_ENV: "development", DATABASE_URL: "not a url" },
      "a local run with an unreadable database setting",
    ],
  ])("refuses %o: %s", (env, _kind) => {
    expect(() => checkSwitcherAtStartup(env)).toThrow(/Ganti peran/);
  });

  it.each([
    [{ VERCEL: "1", VERCEL_ENV: "production" }],
    [{ VERCEL: "1", VERCEL_ENV: "preview" }],
    [{ NODE_ENV: "development", DATABASE_URL: LOCAL_DB }],
    [
      {
        NODE_ENV: "development",
        DATABASE_URL: "postgres://medali@127.0.0.1:5432/medali",
      },
    ],
    [{ NODE_ENV: "production", DATABASE_URL: "postgres://u@db.example.com/x" }],
  ])("lets %o start", (env) => {
    expect(() => checkSwitcherAtStartup(env)).not.toThrow();
  });
});
