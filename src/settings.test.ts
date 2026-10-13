import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  campusEmailEndingOf,
  fileStorageSettingsOf,
  googleSignInSettingsOf,
  SETTING_NAMES,
  stageOf,
} from "./settings";
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

  it("lists the two keys of the file storage by name, with no value", () => {
    const keys = exampleSettings().filter((setting) =>
      setting.name.endsWith("_KEY"),
    );
    expect(keys).toEqual([
      { name: "FILE_STORAGE_ACCESS_KEY", value: "" },
      { name: "FILE_STORAGE_SECRET_KEY", value: "" },
    ]);
  });

  it("does not repeat the keys of the local file storage, not even in a note", () => {
    const example = readFileSync(".env.example", "utf8");
    const compose = readFileSync("compose.yaml", "utf8");
    const localKeys = [...compose.matchAll(/MINIO_ROOT_\w+: (\S+)/g)].map(
      (match) => match[1] ?? "",
    );
    expect(localKeys.length).toBe(2);
    for (const key of localKeys) {
      expect(example).not.toContain(key);
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

describe("fileStorageSettingsOf", () => {
  const FILLED = {
    FILE_STORAGE_URL: "http://localhost:9000",
    FILE_STORAGE_BUCKET: "uji",
    FILE_STORAGE_ACCESS_KEY: "kunci-uji",
    FILE_STORAGE_SECRET_KEY: "rahasia-uji",
  };
  const STAGES = ["local", "pr-preview", "main-preview", "campus"] as const;
  const NAMES = Object.keys(FILLED) as (keyof typeof FILLED)[];

  it.each(STAGES)("reads the four settings in %s", (stage) => {
    expect(fileStorageSettingsOf(FILLED, stage)).toEqual({
      url: "http://localhost:9000",
      bucket: "uji",
      accessKey: "kunci-uji",
      secretKey: "rahasia-uji",
    });
  });

  it.each(["pr-preview", "main-preview"] as const)(
    "turns file keeping off in %s while all four are empty",
    (stage) => {
      expect(fileStorageSettingsOf({}, stage)).toBeNull();
      expect(
        fileStorageSettingsOf(
          { FILE_STORAGE_URL: "", FILE_STORAGE_BUCKET: "" },
          stage,
        ),
      ).toBeNull();
    },
  );

  it.each(["local", "campus"] as const)(
    "names the missing setting in %s when all four are empty, as for the database",
    (stage) => {
      expect(() => fileStorageSettingsOf({}, stage)).toThrow(
        "The setting FILE_STORAGE_URL is missing.",
      );
    },
  );

  describe.each(STAGES)("in %s, with only some filled", (stage) => {
    it.each(NAMES)("names %s when it is the one left empty", (name) => {
      const partly = { ...FILLED, [name]: "" };

      expect(() => fileStorageSettingsOf(partly, stage)).toThrow(
        `The setting ${name} is missing.`,
      );
    });
  });

  it("never writes a key in what it says is missing", () => {
    const partly = { ...FILLED, FILE_STORAGE_BUCKET: undefined };

    expect(() => fileStorageSettingsOf(partly, "pr-preview")).toThrow(
      /^The setting FILE_STORAGE_BUCKET is missing\. Copy \.env\.example to \.env\.local and fill it in\.$/,
    );
  });
});

describe("campusEmailEndingOf", () => {
  it.each([
    ["@kampus.example", "@kampus.example"],
    ["kampus.example", "@kampus.example"],
    ["  @Kampus.Example ", "@kampus.example"],
  ])("reads %o as %s", (written, ending) => {
    expect(campusEmailEndingOf({ CAMPUS_EMAIL_ENDING: written })).toBe(ending);
  });

  it.each([
    [{}],
    [{ CAMPUS_EMAIL_ENDING: "" }],
    [{ CAMPUS_EMAIL_ENDING: " " }],
    [{ CAMPUS_EMAIL_ENDING: "@" }],
  ])("is empty for %o", (env) => {
    expect(campusEmailEndingOf(env)).toBe("");
  });
});

describe("googleSignInSettingsOf", () => {
  const FILLED = {
    GOOGLE_CLIENT_ID: "nomor-uji",
    GOOGLE_CLIENT_SECRET: "rahasia-uji",
    CAMPUS_EMAIL_ENDING: "Kampus.Example",
  };
  const NAMES = Object.keys(FILLED) as (keyof typeof FILLED)[];

  it("reads the three settings, with the ending as it is compared", () => {
    expect(googleSignInSettingsOf(FILLED)).toEqual({
      clientId: "nomor-uji",
      clientSecret: "rahasia-uji",
      campusEnding: "@kampus.example",
    });
  });

  it("is off while all three are empty", () => {
    expect(googleSignInSettingsOf({})).toBeNull();
  });

  it.each(NAMES)("is off when only %s is left empty", (name) => {
    expect(googleSignInSettingsOf({ ...FILLED, [name]: "" })).toBeNull();
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

  it.each([
    [{ VERCEL_ENV: "preview", VERCEL: "1" }],
    [{ VERCEL_ENV: "production", VERCEL: "1" }],
    [{ NODE_ENV: "development" }],
    [{ VERCEL_ENV: "development", NODE_ENV: "development" }],
  ])("reads %o as campus once the campus mark is there", (env) => {
    expect(stageOf({ ...env, MEDALI_CAMPUS: "1" })).toBe("campus");
  });

  it.each(["0", "false", ""])(
    "takes the campus mark whatever it holds, such as %o",
    (value) => {
      const env = { VERCEL_ENV: "preview", MEDALI_CAMPUS: value };

      expect(stageOf(env)).toBe("campus");
    },
  );
});
