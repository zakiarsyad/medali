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
