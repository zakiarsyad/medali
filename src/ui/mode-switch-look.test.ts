import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { pxOf, resolvedValue, tokenBlocks } from "./tokens-read";

const STYLES = "src/ui/file-upload.module.css";

function ruleOf(selector: string): string {
  const styles = `\n${readFileSync(STYLES, "utf8")}`;
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

const row = ruleOf(".modes");
const choice = ruleOf(".mode");

describe("the choose-one row", () => {
  it("is as tall as a form field, so it lines up with the fields beside it", () => {
    expect(row).toContain("min-height: var(--field-height);");
    expect(row).toContain("align-items: stretch;");
  });

  it("shows its choices in the field's text size, not that of its heading", () => {
    expect(choice).toContain("font-size: var(--field-text);");
    expect(choice).not.toContain("font: inherit;");
  });

  it("holds one line of a choice within the field's height", () => {
    expect(row).toContain("padding: var(--space-3xs);");
    expect(row).toContain("border: var(--line-width) solid var(--line);");
    expect(choice).toContain("padding: var(--space-2xs) var(--space-md);");
    expect(choice).toContain("line-height: var(--leading-body);");
    const line =
      Number(resolvedValue("--leading-body", tokens)) * px("--field-text");
    const room =
      2 * px("--space-3xs") + 2 * px("--line-width") + 2 * px("--space-2xs");
    expect(room + line).toBeLessThanOrEqual(px("--field-height"));
  });
});
