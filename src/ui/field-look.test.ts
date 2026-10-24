import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { sourceFilesEndingWith } from "./source-files";
import { pxOf, resolvedValue, tokenBlocks } from "./tokens-read";

const SHARED_STYLES = "src/ui/data-screen.module.css";
const FIELD_TAG = /<(input|select|textarea)\b([^>]*)>/g;
const NOT_A_FIELD_TYPE = /type="(checkbox|radio|hidden|range)"/;
// A file chooser covered by its drop area, which is what shows.
const HIDDEN_CLASS = /className=\{shared\.hidden\}/;
const SHARED_FIELD_CLASS = /\.input\b/;

function ruleOf(file: string, selector: string): string {
  const styles = `\n${readFileSync(file, "utf8")}`;
  const start = styles.indexOf(`\n${selector} {`);
  if (start === -1) return "";
  return styles.slice(start, styles.indexOf("}", start)).replace(/\s+/g, " ");
}

const tokens = tokenBlocks(readFileSync("src/ui/tokens.css", "utf8")).light;

function px(name: string): number {
  const value = pxOf(resolvedValue(name, tokens));
  if (value === undefined) throw new Error(`${name} is not a size in px.`);
  return value;
}

function fieldsWithoutSharedLook(file: string): string[] {
  const code = readFileSync(file, "utf8");
  const missing: string[] = [];
  for (const [tag, , attributes = ""] of code.matchAll(FIELD_TAG)) {
    if (NOT_A_FIELD_TYPE.test(attributes)) continue;
    if (HIDDEN_CLASS.test(attributes)) continue;
    if (SHARED_FIELD_CLASS.test(attributes)) continue;
    missing.push(`${file}: ${tag.replace(/\s+/g, " ")}`);
  }
  return missing;
}

const field = ruleOf(SHARED_STYLES, ".input");

describe("a form field", () => {
  it("takes the shared text size and weight, not those of its label or table", () => {
    expect(field).toContain("font-size: var(--field-text);");
    expect(field).toContain("font-weight: var(--field-weight);");
  });

  it("is at least the shared height, so a box of several lines keeps its own", () => {
    expect(field).toContain("min-height: var(--field-height);");
  });

  it("holds one line of text within the shared height, so it is exactly that tall", () => {
    expect(field).toContain("padding: var(--space-xs) var(--space-sm);");
    expect(field).toContain("border: var(--line-width) solid var(--line);");
    const line =
      Number(resolvedValue("--leading-body", tokens)) * px("--field-text");
    const room = 2 * px("--space-xs") + 2 * px("--line-width") + line;
    expect(room).toBeLessThanOrEqual(px("--field-height"));
  });

  it("wears the shared look on every screen", () => {
    const missing = sourceFilesEndingWith(".tsx")
      .filter((file) => !file.endsWith(".test.tsx"))
      .flatMap(fieldsWithoutSharedLook);
    expect(missing).toEqual([]);
  });
});
