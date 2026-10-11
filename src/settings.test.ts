import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { SETTING_NAMES, stageOf } from "./settings";
import { sourceFilesEndingWith } from "./ui/source-files";

const SETTING_LINE = /^([A-Z][A-Z0-9_]*)=(.*)$/;
const SETTINGS_FILE = "src/settings.ts";

function exampleSettings(): { name: string; value: string }[] {
  const lines = readFileSync(".env.example", "utf8").split("\n");
  const found: { name: string; value: string }[] = [];
  for (const line of lines) {
    const match = line.match(SETTING_LINE);
    if (match) found.push({ name: match[1] ?? "", value: match[2] ?? "" });
  }
  return found;
}

describe("the example settings file", () => {
  it("lists every setting the app reads", () => {
    const names = exampleSettings().map((setting) => setting.name);
    expect(names.sort()).toEqual([...SETTING_NAMES].sort());
  });

  it("holds names only, no values", () => {
    for (const setting of exampleSettings()) {
      expect(setting.value).toBe("");
    }
  });
});

describe("source code", () => {
  const code = [
    ...sourceFilesEndingWith(".ts"),
    ...sourceFilesEndingWith(".tsx"),
  ].filter((path) => !path.endsWith(".test.ts") && path !== SETTINGS_FILE);

  it.each(code)("%s reads settings only through the settings file", (path) => {
    expect(readFileSync(path, "utf8")).not.toMatch(/process\.env\.[A-Z]/);
  });
});

describe("stageOf", () => {
  it.each([
    [{ VERCEL_ENV: "preview", NODE_ENV: "production" }, "pr-preview"],
    [{ VERCEL_ENV: "production", NODE_ENV: "production" }, "main-preview"],
    [{ NODE_ENV: "development" }, "local"],
    [{ VERCEL_ENV: "development", NODE_ENV: "development" }, "local"],
  ])("reads %o as %s", (env, stage) => {
    expect(stageOf(env)).toBe(stage);
  });

  it.each([
    [{ NODE_ENV: "production" }],
    [{ NODE_ENV: "test" }],
    [{}],
    [{ VERCEL_ENV: "something-new" }],
  ])("reads anything without a clear yes, such as %o, as campus", (env) => {
    expect(stageOf(env)).toBe("campus");
  });
});
