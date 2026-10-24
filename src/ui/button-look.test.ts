import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { pxOf, resolvedValue, tokenBlocks } from "./tokens-read";

const SHARED_STYLES = "src/ui/data-screen.module.css";

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

function topAndBottom(padding: string): number {
  const [top = "", , bottom = top] = padding.split(" ");
  const sizes = [pxOf(top), pxOf(bottom)];
  if (sizes.includes(undefined)) throw new Error(`${padding} is not in px.`);
  return (sizes[0] ?? 0) + (sizes[1] ?? 0);
}

const main = ruleOf(SHARED_STYLES, ".button");
const second = ruleOf(SHARED_STYLES, ".quiet");
const linkLook = ruleOf(SHARED_STYLES, ".link,\n.danger");
const asLink = ruleOf(SHARED_STYLES, "a.button,\na.quiet");

describe.each([
  ["main", main],
  ["second", second],
])("the %s button", (_kind, rule) => {
  it("takes the shared text size and weight, not those of its table", () => {
    expect(rule).toContain("font-size: var(--button-text);");
    expect(rule).toContain("font-weight: var(--button-weight);");
  });

  it("takes the shared height and inner space", () => {
    expect(rule).toContain("min-height: var(--button-height);");
    expect(rule).toContain("padding: var(--button-padding);");
  });

  it("centres its words in its height, also on a label, summary or span", () => {
    expect(rule).toContain("align-content: center;");
  });

  it("has a line as wide as the other button's", () => {
    expect(rule).toContain("border: var(--line-width) solid");
  });
});

describe("the two buttons side by side", () => {
  it("are the same height: one line of text fits in the shared height", () => {
    const line =
      Number(resolvedValue("--leading-body", tokens)) * px("--button-text");
    const room =
      topAndBottom(resolvedValue("--button-padding", tokens)) +
      2 * px("--line-width") +
      line;
    expect(room).toBeLessThanOrEqual(px("--button-height"));
  });

  it("show the main button's line in the colour of its background", () => {
    expect(main).toContain("border: var(--line-width) solid var(--navy);");
    expect(main).toContain("background: var(--navy);");
  });

  it("are as tall as a button when they are links, with their words in the middle", () => {
    expect(asLink).toContain("display: inline-flex;");
    expect(asLink).toContain("align-items: center;");
  });
});

describe("a button that looks like a link", () => {
  it("keeps its look", () => {
    expect(linkLook).toContain("padding: 0;");
    expect(linkLook).toContain("border: 0;");
    expect(linkLook).toContain("font: inherit;");
    expect(linkLook).not.toContain("height");
  });
});
