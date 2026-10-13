import { describe, expect, it } from "vitest";
import { accountSwitcherOn } from "@/auth/account-switcher";
import { stageOf } from "@/settings";
import {
  missingSettings,
  settingsToRemove,
  startRefusals,
} from "./start-check";

const FILLED = {
  MEDALI_CAMPUS: "1",
  NODE_ENV: "production",
  DATABASE_URL: "postgres://medali:sandi-uji@db:5432/medali",
  FILE_STORAGE_URL: "http://files:9000",
  FILE_STORAGE_BUCKET: "medali",
  FILE_STORAGE_ACCESS_KEY: "kunci-uji",
  FILE_STORAGE_SECRET_KEY: "rahasia-uji",
  GOOGLE_CLIENT_ID: "nomor-uji",
  GOOGLE_CLIENT_SECRET: "rahasia-google-uji",
  CAMPUS_EMAIL_ENDING: "@kampus.example",
};

const REQUIRED = [
  "DATABASE_URL",
  "FILE_STORAGE_URL",
  "FILE_STORAGE_BUCKET",
  "FILE_STORAGE_ACCESS_KEY",
  "FILE_STORAGE_SECRET_KEY",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "CAMPUS_EMAIL_ENDING",
] as const;

const LOOK_ALIKES = [
  [{ VERCEL_ENV: "preview" }, ["VERCEL_ENV"]],
  [{ VERCEL_ENV: "production" }, ["VERCEL_ENV"]],
  [{ VERCEL: "1" }, ["VERCEL"]],
  [{ NODE_ENV: "development" }, ["NODE_ENV"]],
  [
    { VERCEL_ENV: "preview", VERCEL: "1", NODE_ENV: "development" },
    ["VERCEL_ENV", "VERCEL", "NODE_ENV"],
  ],
] as const;

describe("settingsToRemove", () => {
  it("finds nothing to remove in the package as it is built", () => {
    expect(settingsToRemove(FILLED)).toEqual([]);
  });

  it.each(LOOK_ALIKES)(
    "names what turns Ganti peran on elsewhere in %o",
    (extra, names) => {
      expect(settingsToRemove({ ...FILLED, ...extra })).toEqual(names);
    },
  );

  it.each([[{ VERCEL_ENV: "" }], [{ VERCEL: "" }], [{ NODE_ENV: "test" }]])(
    "leaves %o alone: it turns Ganti peran on nowhere",
    (extra) => {
      expect(settingsToRemove({ ...FILLED, ...extra })).toEqual([]);
    },
  );
});

describe("the campus mark", () => {
  it.each(LOOK_ALIKES)("keeps Ganti peran off with %o", (extra) => {
    const stage = stageOf({ ...FILLED, ...extra });

    expect(stage).toBe("campus");
    expect(accountSwitcherOn(stage)).toBe(false);
  });

  it.each(LOOK_ALIKES)("is what keeps it off with %o", (extra) => {
    const { MEDALI_CAMPUS: _mark, ...unmarked } = { ...FILLED, ...extra };
    const turnsItOn = "VERCEL_ENV" in extra || "NODE_ENV" in extra;

    expect(accountSwitcherOn(stageOf(unmarked))).toBe(turnsItOn);
  });
});

describe("missingSettings", () => {
  it("finds nothing missing when every setting is filled", () => {
    expect(missingSettings(FILLED)).toEqual([]);
  });

  it.each(REQUIRED)("names %s alone when it is the one left empty", (name) => {
    expect(missingSettings({ ...FILLED, [name]: "" })).toEqual([name]);
  });

  it.each(REQUIRED)("names %s alone when it is not there at all", (name) => {
    const { [name]: _left, ...rest } = FILLED;

    expect(missingSettings(rest)).toEqual([name]);
  });

  it("names every missing one at once", () => {
    expect(missingSettings({ MEDALI_CAMPUS: "1" })).toEqual(REQUIRED);
  });

  it("counts a campus address ending of only spaces as missing", () => {
    const blank = { ...FILLED, CAMPUS_EMAIL_ENDING: " " };

    expect(missingSettings(blank)).toEqual(["CAMPUS_EMAIL_ENDING"]);
  });
});

describe("startRefusals", () => {
  it("lets the package start with every setting filled", () => {
    expect(startRefusals(FILLED)).toEqual([]);
  });

  it.each(LOOK_ALIKES)(
    "refuses %o and says which settings to remove",
    (extra, names) => {
      const refusals = startRefusals({ ...FILLED, ...extra });

      expect(refusals).toHaveLength(1);
      expect(refusals[0]).toContain("Ganti peran");
      expect(refusals[0]).toContain(`Remove: ${names.join(", ")}.`);
      expect(refusals[0]).toContain("refused to start");
    },
  );

  it.each(REQUIRED)(
    "refuses to start without %s, and names it alone",
    (name) => {
      const refusals = startRefusals({ ...FILLED, [name]: "" });

      expect(refusals).toHaveLength(1);
      expect(refusals[0]).toContain("refused to start");
      for (const other of REQUIRED) {
        expect(refusals[0]?.includes(other)).toBe(other === name);
      }
    },
  );

  it("says where the database's address comes from in the package", () => {
    const [refusal] = startRefusals({ ...FILLED, DATABASE_URL: "" });

    expect(refusal).toContain("DATABASE_PASSWORD");
  });

  it.each([
    "ab/cd9",
    "ab#cd9",
    "ab?cd9",
    "ab%cd9",
    "ab cd9",
    "sandi-uji",
    "@b:c",
  ])(
    "refuses the database password %o, which would break the database's address",
    (password) => {
      const refusals = startRefusals({
        ...FILLED,
        DATABASE_PASSWORD: password,
        DATABASE_URL: `postgres://medali:${password}@db:5432/medali`,
      });

      expect(refusals).toHaveLength(1);
      expect(refusals[0]).toContain("DATABASE_PASSWORD");
      expect(refusals[0]).toContain("letters and digits only");
      expect(refusals[0]).toContain("refused to start");
      expect(refusals[0]).not.toContain(password);
    },
  );

  it("takes a database password of letters and digits", () => {
    const filled = { ...FILLED, DATABASE_PASSWORD: "sandiUjiCoba123" };

    expect(startRefusals(filled)).toEqual([]);
  });

  it("leaves an empty database password to the refusal for what is missing", () => {
    const refusals = startRefusals({
      ...FILLED,
      DATABASE_PASSWORD: "",
      DATABASE_URL: "",
    });

    expect(refusals).toHaveLength(1);
    expect(refusals[0]).toContain("These settings are empty: DATABASE_URL.");
  });

  it("refuses a database address that cannot be read, without showing it", () => {
    const address = "postgres://medali:ab/cd9@db:5432/medali";
    const refusals = startRefusals({ ...FILLED, DATABASE_URL: address });

    expect(refusals).toHaveLength(1);
    expect(refusals[0]).toContain("DATABASE_URL");
    expect(refusals[0]).toContain("refused to start");
    expect(refusals[0]).not.toContain("ab/cd9");
    expect(refusals[0]).not.toContain("postgres://");
  });

  it("gives both refusals when a setting is missing and another must go", () => {
    const refusals = startRefusals({
      ...FILLED,
      VERCEL_ENV: "preview",
      GOOGLE_CLIENT_ID: "",
    });

    expect(refusals).toHaveLength(2);
  });

  it.each([
    ["FILE_STORAGE_ACCESS_KEY", "ab", "3"],
    ["FILE_STORAGE_SECRET_KEY", "pendek7", "8"],
  ])(
    "refuses a %s too short for the file storage to start, without showing it",
    (name, key, shortest) => {
      const refusals = startRefusals({ ...FILLED, [name]: key });

      expect(refusals).toHaveLength(1);
      expect(refusals[0]).toContain(name);
      expect(refusals[0]).toContain(`at least ${shortest} characters`);
      expect(refusals[0]).toContain("refused to start");
      expect(refusals[0]).not.toContain(key);
    },
  );

  it("takes file storage keys of the shortest length", () => {
    const refusals = startRefusals({
      ...FILLED,
      FILE_STORAGE_ACCESS_KEY: "abc",
      FILE_STORAGE_SECRET_KEY: "12345678",
    });

    expect(refusals).toEqual([]);
  });

  it("never shows a value of a setting", () => {
    const refusals = startRefusals({
      ...FILLED,
      VERCEL_ENV: "preview",
      GOOGLE_CLIENT_ID: "",
    }).join("\n");

    for (const [name, value] of Object.entries(FILLED)) {
      if (name === "MEDALI_CAMPUS") continue;
      expect(refusals).not.toContain(value);
    }
    expect(refusals).not.toContain("preview");
  });

  it("refuses to start without the campus mark, whatever else is set", () => {
    const { MEDALI_CAMPUS: _mark, ...unmarked } = FILLED;
    const refusals = startRefusals(unmarked);

    expect(refusals).toHaveLength(1);
    expect(refusals[0]).toContain("MEDALI_CAMPUS");
  });
});
