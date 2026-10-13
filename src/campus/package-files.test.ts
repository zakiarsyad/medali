import { existsSync, readdirSync, readFileSync } from "node:fs";
import { posix } from "node:path";
import { describe, expect, it } from "vitest";
import { SETTING_NAMES } from "@/settings";
import { sourceFilesEndingWith } from "@/ui/source-files";

function linesOf(file: string): string[] {
  return readFileSync(file, "utf8")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "" && !line.startsWith("#"));
}

const IGNORE_PATTERNS = linesOf(".dockerignore");

function escaped(text: string): string {
  return text.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
}

/** One line of the ignore file, as Docker reads it. */
function patternOf(line: string): RegExp {
  const body = line
    .split("**/")
    .map((part) => part.split("*").map(escaped).join("[^/]*"))
    .join("(?:.*/)?");
  return new RegExp(`^${body}$`);
}

/** A path with every folder above it: ignoring a folder ignores what it holds. */
function withFoldersAbove(path: string): string[] {
  const parts = path.split("/");
  return parts.map((_part, place) => parts.slice(0, place + 1).join("/"));
}

function isIgnored(path: string): boolean {
  const patterns = IGNORE_PATTERNS.map(patternOf);
  return withFoldersAbove(path).some((part) =>
    patterns.some((pattern) => pattern.test(part)),
  );
}

const SOURCE_FILES = sourceFilesEndingWith("");

function nameOf(path: string): string {
  return posix.basename(path);
}

const SETTINGS_FILE = /^\.env|\.env$/;
const SAMPLE_DATA_FILE = /^(sample-|seed)/;
const CHECKS_FILE = /^test-|\.test\.tsx?$/;

function importsOf(path: string): string[] {
  const text = readFileSync(path, "utf8");
  return [...text.matchAll(/from "((?:@\/|\.)[^"]+)"/g)].map(
    (match) => match[1] ?? "",
  );
}

/** The file an import names, among the files of the repo. */
function importedFile(from: string, name: string): string | undefined {
  const base = name.startsWith("@/")
    ? `src/${name.slice(2)}`
    : posix.join(posix.dirname(from), name);
  return [base, `${base}.ts`, `${base}.tsx`].find((path) =>
    SOURCE_FILES.includes(path),
  );
}

describe("what stays out of the campus server package", () => {
  it("lets nothing back in that a line keeps out", () => {
    expect(IGNORE_PATTERNS.filter((line) => line.startsWith("!"))).toEqual([]);
  });

  it("keeps out every settings file", () => {
    const atRoot = readdirSync(".").filter((name) => SETTINGS_FILE.test(name));
    const inSource = SOURCE_FILES.filter((path) =>
      SETTINGS_FILE.test(nameOf(path)),
    );

    expect(atRoot).toContain(".env.example");
    expect(inSource).toContain("src/db/local-commands.env");
    expect([...atRoot, ...inSource].filter((path) => !isIgnored(path))).toEqual(
      [],
    );
    expect(isIgnored(".env.campus")).toBe(true);
    expect(isIgnored(".env")).toBe(true);
  });

  it("keeps out every sample data file", () => {
    const sample = SOURCE_FILES.filter((path) =>
      SAMPLE_DATA_FILE.test(nameOf(path)),
    );

    expect(sample).toContain("src/db/sample-data.ts");
    expect(sample).toContain("src/db/seed-command.ts");
    expect(sample.filter((path) => !isIgnored(path))).toEqual([]);
  });

  it("keeps out every check and the records made up for the checks", () => {
    const checks = SOURCE_FILES.filter((path) =>
      CHECKS_FILE.test(nameOf(path)),
    );

    expect(checks).toContain("src/auth/test-records.ts");
    expect(checks.filter((path) => !isIgnored(path))).toEqual([]);
  });

  it.each([
    ".git/config",
    "node_modules/next/package.json",
    ".next/BUILD_ID",
    "docs/PROTOTYPE.html",
    "docs/HOSTING.md",
    "src/db/rebuild.ts",
    "src/db/deploy-command.ts",
    "src/db/deploy-database.ts",
    "src/db/deploy-start.ts",
    "src/files/deploy-command.ts",
    "src/files/deploy-files.ts",
  ])("keeps out %s", (path) => {
    expect(isIgnored(path)).toBe(true);
  });

  it.each([
    "package.json",
    "pnpm-lock.yaml",
    "docker/campus-start.sh",
    "src/db/schema.ts",
    "src/db/migrations/0000_accounts-roles-students.sql",
  ])("keeps %s in", (path) => {
    expect(existsSync(path)).toBe(true);
    expect(isIgnored(path)).toBe(false);
  });

  it("leaves no file in that needs one kept out", () => {
    const kept = SOURCE_FILES.filter(
      (path) => /\.tsx?$/.test(path) && !isIgnored(path),
    );
    const broken: string[] = [];
    for (const path of kept) {
      for (const name of importsOf(path)) {
        const file = importedFile(path, name);
        if (file && isIgnored(file)) broken.push(`${path} needs ${file}`);
      }
    }

    expect(broken).toEqual([]);
  });
});

describe("the recipe of the campus server package", () => {
  const recipe = linesOf("Dockerfile");

  it("builds the campus mark in", () => {
    expect(recipe).toContain("ENV MEDALI_CAMPUS=1");
  });

  it("takes no value from whoever builds it", () => {
    expect(recipe.filter((line) => line.startsWith("ARG"))).toEqual([]);
  });

  it("sets no setting of the app, so no key and no password", () => {
    const set = recipe
      .filter((line) => line.startsWith("ENV "))
      .map((line) => line.slice("ENV ".length).split("=")[0]);

    expect(set.sort()).toEqual(["COREPACK_HOME", "MEDALI_CAMPUS", "NODE_ENV"]);
    for (const name of SETTING_NAMES) {
      expect(recipe.join("\n")).not.toContain(name);
    }
  });

  it("names no key and no password anywhere", () => {
    expect(recipe.join("\n")).not.toMatch(/password|secret|_key|token/i);
  });

  it("runs the app as a user that is not the computer's own", () => {
    const users = recipe.filter((line) => line.startsWith("USER "));

    expect(users.at(-1)).toBe("USER node");
  });

  it("uses the Node.js version the repo names", () => {
    const version = readFileSync(".nvmrc", "utf8").trim();

    expect(recipe).toContain(`FROM node:${version}-slim AS base`);
  });
});

const PACKAGE_FILE = "compose.campus.yaml";
const SERVICE_START = /^ {2}([a-z-]+):$/;
const TOP_LEVEL_START = /^[a-z-]+:/;

/** The lines of each service of a compose file, by the service's name. */
function servicesOf(file: string): Map<string, string[]> {
  const lines = readFileSync(file, "utf8").split("\n");
  const services = new Map<string, string[]>();
  let inServices = false;
  let current: string[] | undefined;
  for (const line of lines) {
    if (TOP_LEVEL_START.test(line)) {
      inServices = line === "services:";
      continue;
    }
    if (!inServices) continue;
    const name = line.match(SERVICE_START)?.[1];
    if (name) {
      current = [];
      services.set(name, current);
      continue;
    }
    current?.push(line.trim());
  }
  return services;
}

function settingNamesIn(text: string): string[] {
  return [...text.matchAll(/\$\{([A-Z_]+)/g)].map((match) => match[1] ?? "");
}

describe("the campus server package", () => {
  const text = readFileSync(PACKAGE_FILE, "utf8");
  const services = servicesOf(PACKAGE_FILE);
  const INSIDE_ONLY = ["db", "files"];

  it("has the app, the database and the file storage", () => {
    expect([...services.keys()]).toEqual(
      expect.arrayContaining(["app", ...INSIDE_ONLY]),
    );
  });

  it("lets only the app be reached from outside", () => {
    const reachable = [...services].filter(([, lines]) =>
      lines.some((line) => /^(ports|network_mode|expose):/.test(line)),
    );

    expect(reachable.map(([name]) => name)).toEqual(["app"]);
  });

  it.each(INSIDE_ONLY)("gives %s no port of the server", (name) => {
    const lines = services.get(name) ?? [];

    expect(lines.length).toBeGreaterThan(0);
    expect(lines.join("\n")).not.toMatch(/ports|network_mode|expose/);
    expect(lines.join("\n")).not.toMatch(/\d+:\d+/);
  });

  it("opens one port, the app's own", () => {
    const published = (services.get("app") ?? []).filter((line) =>
      /^- "[^"]*:\d+"$/.test(line),
    );

    expect(published).toEqual(['- "$' + '{APP_PORT:-3000}:3000"']);
  });

  it.each([
    ["db", "db-data"],
    ["files", "files-data"],
  ])("keeps what %s holds in %s, outside the container", (name, volume) => {
    expect(services.get(name)?.join("\n")).toContain(`- ${volume}:/`);
    expect(text).toMatch(new RegExp(`\\nvolumes:\\n(.*\\n)*? {2}${volume}:`));
  });

  it("never shares a name with the local database and file storage", () => {
    const local = readFileSync("compose.yaml", "utf8");

    expect(text).toMatch(/^name: medali-campus$/m);
    expect(local).toMatch(/^name: medali$/m);
  });

  it("writes no key and no password itself", () => {
    const secrets = text
      .split("\n")
      .filter((line) => /^\s+(POSTGRES_PASSWORD|MINIO_ROOT_\w+):/.test(line));

    expect(secrets.length).toBe(3);
    for (const line of secrets) {
      expect(line).toMatch(/: \$\{[A-Z_]+:-\}$/);
    }
  });

  it.each(INSIDE_ONLY)(
    "starts %s only after the check of the settings passed",
    (name) => {
      const waitsFor = services.get(name)?.join("\n");

      expect(services.get("check")?.join("\n")).toContain(
        "src/campus/start-check-command.ts",
      );
      expect(waitsFor).toContain(
        "depends_on:\ncheck:\ncondition: service_completed_successfully",
      );
    },
  );

  it("starts the app only once the database and the file storage answer", () => {
    expect(services.get("app")?.join("\n")).toContain(
      "depends_on:\ndb:\ncondition: service_healthy\nfiles:\ncondition: service_healthy",
    );
  });

  it("checks the settings, then the database, then the files, before the app starts", () => {
    const steps = linesOf("docker/campus-start.sh");

    expect(steps).toEqual([
      "set -e",
      "node_modules/.bin/tsx src/campus/start-check-command.ts",
      "node_modules/.bin/tsx src/campus/database-command.ts",
      "node_modules/.bin/tsx src/files/prepare-command.ts",
      "exec node_modules/.bin/next start",
    ]);
  });

  it("takes the local file storage's own image", () => {
    const image = /image: (pgsty\/minio:\S+)/;
    const local = readFileSync("compose.yaml", "utf8").match(image)?.[1];

    expect(local).toBeDefined();
    expect(text.match(image)?.[1]).toBe(local);
  });
});

describe("the backup part of the campus server package", () => {
  const part = servicesOf(PACKAGE_FILE).get("backup") ?? [];
  const recipe = linesOf("docker/backup/Dockerfile");

  function imageOf(name: string): string | undefined {
    const lines = servicesOf(PACKAGE_FILE).get(name) ?? [];
    return lines.join("\n").match(/^image: (\S+)$/m)?.[1];
  }

  /** How the package file writes "this setting, or this while it is empty". */
  function fromSettings(name: string, whenEmpty = ""): string {
    return `\${${name}:-${whenEmpty}}`;
  }

  it("is in the package, with no port of the server", () => {
    expect(part).toContain("build: docker/backup");
    expect(part.join("\n")).not.toMatch(/ports|network_mode|expose/);
  });

  it("takes the backup folder and the backup password only from the settings", () => {
    const written = part.filter((line) => /BACKUP_|\/backups/.test(line));

    expect(written).toEqual([
      `BACKUP_FOLDER: ${fromSettings("BACKUP_FOLDER")}`,
      `BACKUP_PASSWORD: ${fromSettings("BACKUP_PASSWORD")}`,
      `BACKUP_HOUR: ${fromSettings("BACKUP_HOUR")}`,
      `BACKUP_KEEP: ${fromSettings("BACKUP_KEEP")}`,
      `- ${fromSettings("BACKUP_FOLDER", "no-backup-folder")}:/backups`,
    ]);
  });

  it("is not given the whole settings file", () => {
    expect(part.join("\n")).not.toContain("env_file");
  });

  it("is built with no value from whoever builds it and no setting", () => {
    const set = recipe.filter((line) => /^(ARG|ENV)\b/.test(line));

    expect(recipe.length).toBeGreaterThan(0);
    expect(set).toEqual([]);
  });

  it("is built with no backup folder, no password and no key", () => {
    expect(recipe.join("\n")).not.toMatch(/BACKUP_|\/backups/);
    expect(recipe.join("\n")).not.toMatch(/password|secret|_key|token/i);
  });

  it("takes its tools from the images of the package's own database and file storage", () => {
    const from = recipe
      .filter((line) => line.startsWith("FROM "))
      .map((line) => line.split(" ")[1]);

    expect(imageOf("db")).toBeDefined();
    expect(imageOf("files")).toBeDefined();
    expect(from).toEqual([imageOf("files"), imageOf("db")]);
  });

  it.each([
    "docker/backup/backup.sh",
    "docker/backup/Dockerfile",
    "x/2026-10-13-020000.medali-backup",
    "x/2026-10-13-020000.medali-backup.part",
    "2026-10-13-020000.medali-backup",
  ])("stays out of the app's own package: %s", (path) => {
    expect(isIgnored(path)).toBe(true);
  });

  it("keeps a backup, finished or not, out of the repo wherever its folder is", () => {
    const kept = linesOf(".gitignore");

    expect(kept).toContain("*.medali-backup");
    expect(kept).toContain("*.medali-backup.part");
    expect(kept.filter((line) => line.startsWith("!"))).toEqual([
      "!.env.example",
      "!.env.campus.example",
    ]);
  });
});

describe("the example settings file of the package", () => {
  const SETTING_LINE = /^([A-Z][A-Z0-9_]*)=(.*)$/;
  const example = linesOf(".env.campus.example").map(
    (line) => line.match(SETTING_LINE) ?? [],
  );
  const names = example.map((match) => match[1]);

  it("lists every setting the package takes from the server", () => {
    const taken = settingNamesIn(readFileSync(PACKAGE_FILE, "utf8"));

    expect(taken.length).toBeGreaterThan(0);
    expect(names).toEqual(expect.arrayContaining(taken));
    expect(names).toEqual(
      expect.arrayContaining([
        "GOOGLE_CLIENT_ID",
        "GOOGLE_CLIENT_SECRET",
        "CAMPUS_EMAIL_ENDING",
        "BACKUP_FOLDER",
        "BACKUP_PASSWORD",
        "BACKUP_HOUR",
        "BACKUP_KEEP",
      ]),
    );
  });

  it("holds names only, no values", () => {
    expect(example.length).toBeGreaterThan(0);
    for (const match of example) {
      expect(match[2]).toBe("");
    }
  });

  it("is the only settings file of the package that goes into the repo", () => {
    const kept = linesOf(".gitignore");

    expect(kept).toContain(".env.*");
    expect(kept).toContain("!.env.campus.example");
    expect(kept).not.toContain("!.env.campus");
  });
});
