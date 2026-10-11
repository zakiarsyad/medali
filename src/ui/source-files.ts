import { readdirSync } from "node:fs";
import { join } from "node:path";

const SOURCE_FOLDER = "src";

export function sourceFilesEndingWith(ending: string): string[] {
  return readdirSync(SOURCE_FOLDER, { recursive: true, encoding: "utf8" })
    .map((name) => join(SOURCE_FOLDER, name))
    .filter((path) => path.endsWith(ending));
}
