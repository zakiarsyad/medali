import { describe, expect, it } from "vitest";
import { accountSwitcherOn, checkSwitcherAtStartup } from "./account-switcher";

describe("accountSwitcherOn", () => {
  it("is off on the campus server", () => {
    expect(accountSwitcherOn("campus")).toBe(false);
  });

  it.each(["local", "pr-preview", "main-preview", "render-preview"] as const)(
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
    [{ MEDALI_RENDER_PREVIEW: "1" }, "the Render preview not on Render"],
    [
      {
        MEDALI_RENDER_PREVIEW: "1",
        RENDER: "true",
        RENDER_SERVICE_NAME: "medali",
      },
      "the Render preview sign on the app of medali.site",
    ],
    [
      { MEDALI_RENDER_PREVIEW: "1", RENDER_SERVICE_NAME: "medali-preview" },
      "the Render preview with only the service name",
    ],
    [
      { MEDALI_RENDER_PREVIEW: "1", VERCEL: "1" },
      "the Render preview sign on Vercel",
    ],
    [
      {
        VERCEL_ENV: "preview",
        RENDER: "true",
        RENDER_SERVICE_NAME: "medali-preview",
      },
      "a PR preview on Render instead of Vercel",
    ],
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
    [
      {
        MEDALI_RENDER_PREVIEW: "1",
        RENDER: "true",
        RENDER_SERVICE_NAME: "medali-preview",
      },
    ],
    [{ RENDER: "true", RENDER_SERVICE_NAME: "medali", MEDALI_CAMPUS: "1" }],
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
