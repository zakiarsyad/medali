import { readdirSync } from "node:fs";
import { sep } from "node:path";

const SOURCE_FOLDER = "src";

// Windows separates folders with "\". Paths are written with "/" on every
// computer, so a check can name a file the same way everywhere.
export function sourceFilesEndingWith(ending: string): string[] {
  return readdirSync(SOURCE_FOLDER, { recursive: true, encoding: "utf8" })
    .map((name) => `${SOURCE_FOLDER}/${name.replaceAll(sep, "/")}`)
    .filter((path) => path.endsWith(ending));
}
