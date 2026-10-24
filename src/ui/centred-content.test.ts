import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { inForce, resolvedValue, tokenBlocks } from "./tokens-read";

function ruleOf(file: string, selector: string): string {
  const styles = `\n${readFileSync(file, "utf8")}`;
  const start = styles.indexOf(`\n${selector} {`);
  if (start === -1) return "";
  return styles.slice(start, styles.indexOf("}", start)).replace(/\s+/g, " ");
}

function sideRoom(padding: string): string | undefined {
  return padding.split(" ")[1];
}

const tokens = tokenBlocks(readFileSync("src/ui/tokens.css", "utf8"));
const content = ruleOf("src/ui/app-shell.module.css", ".content");
const bar = ruleOf("src/ui/top-bar.module.css", ".top");
const row = ruleOf("src/ui/top-bar.module.css", ".row");

describe("the content on a wide screen", () => {
  it("stops at the shared widest size and is centred beside the side menu", () => {
    expect(content).toContain("max-width: var(--content-max-width);");
    expect(content).toContain("margin-inline: auto;");
  });
});

describe("the top bar on a wide screen", () => {
  it("runs the full width with its line", () => {
    expect(bar).not.toContain("max-width");
    expect(bar).toContain("border-bottom:");
  });

  it("holds a row with the content's widest size and centring", () => {
    expect(row).toContain("width: 100%;");
    expect(row).toContain("max-width: var(--content-max-width);");
    expect(row).toContain("margin-inline: auto;");
    expect(row).toContain("padding: var(--top-bar-padding);");
  });

  it.each([
    ["computer", tokens.light],
    ["phone", inForce(tokens.light, tokens.phone)],
  ])("keeps the content's side room on a %s", (_width, values) => {
    expect(sideRoom(resolvedValue("--top-bar-padding", values))).toBe(
      sideRoom(resolvedValue("--content-padding", values)),
    );
  });
});
