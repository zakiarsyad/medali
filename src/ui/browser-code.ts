import { existsSync, readdirSync, readFileSync } from "node:fs";
// Places are written with "/" on every computer, as the checks write them.
import { dirname, join } from "node:path/posix";

/*
 * A screen part that runs in the browser is sent there with every file it
 * takes a thing from, and with what those take in turn. A file that also
 * holds a database read would send the database code and the names of
 * the tables along.
 */

const IMPORT = /import\s+(type\s+)?[\s\S]*?\s+from\s+"([^"]+)";/g;
const RUNS_IN_BROWSER = /^\s*"use client";/;
const RUNS_ON_SERVER = /^\s*"use server";/;
const DATABASE_CODE = /^(?:drizzle-orm|postgres)(?:\/|$)/;

/** What a file takes for use while it runs: not what it takes as a type only. */
function takenBy(source: string): string[] {
  const taken: string[] = [];
  for (const [, typeOnly, from = ""] of source.matchAll(IMPORT)) {
    if (typeOnly === undefined) taken.push(from);
  }
  return taken;
}

/** The file a thing is taken from, or null for a library or a style file. */
function fileOf(from: string, takenIn: string): string | null {
  const isOwnCode = from.startsWith("./") || from.startsWith("@/");
  if (!isOwnCode) return null;
  const base = from.startsWith("@/")
    ? join("src", from.slice(2))
    : join(dirname(takenIn), from);
  const found = [`${base}.ts`, `${base}.tsx`].find((path) => existsSync(path));
  return found ?? null;
}

/**
 * The database code a file would take to the browser, by way of the files
 * it takes from. A file of actions stays on the server: the browser gets
 * only a way to call it.
 */
export function databaseCodeReachedFrom(start: string): string[] {
  const reached: string[] = [];
  const seen = new Set<string>();
  const waiting = [start];
  for (let path = waiting.pop(); path !== undefined; path = waiting.pop()) {
    if (seen.has(path)) continue;
    seen.add(path);
    const source = readFileSync(path, "utf8");
    if (RUNS_ON_SERVER.test(source)) continue;
    for (const from of takenBy(source)) {
      if (DATABASE_CODE.test(from)) reached.push(`${path} takes ${from}`);
      const file = fileOf(from, path);
      if (file !== null) waiting.push(file);
    }
  }
  return reached;
}

/** The screen parts of a folder that run in the browser. */
export function browserFilesIn(folder: string): string[] {
  return readdirSync(folder)
    .filter((name) => name.endsWith(".tsx") && !name.endsWith(".test.tsx"))
    .map((name) => join(folder, name))
    .filter((path) => RUNS_IN_BROWSER.test(readFileSync(path, "utf8")));
}
