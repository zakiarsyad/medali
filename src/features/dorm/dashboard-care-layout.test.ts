import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const STYLES = readFileSync("src/features/dorm/dashboard.module.css", "utf8");
const TOKENS = readFileSync("src/ui/tokens.css", "utf8");
const PHONE = TOKENS.slice(TOKENS.indexOf("@media (max-width: 860px)"));
const COMPUTER = TOKENS.slice(0, TOKENS.indexOf("@media (max-width: 860px)"));

/** What a rule of the style file holds, without the breaks between its lines. */
function ruleOf(selector: string): string {
  const start = STYLES.indexOf(`\n${selector} {`);
  if (start === -1) return "";
  const body = STYLES.slice(start, STYLES.indexOf("}", start));
  return body.replace(/\s+/g, " ");
}

describe("a resident in Perlu perhatian dan tindak lanjut medis", () => {
  it("lets a long category wrap inside the card instead of holding it on one line", () => {
    expect(ruleOf(".careStatus")).toContain(
      "flex: 0 1 var(--care-status-basis);",
    );
    expect(ruleOf(".careStatus")).toContain("min-width: 0;");
    expect(ruleOf(".careStatus")).not.toContain("nowrap");
  });

  it("never squeezes the resident's name, room and history below a card's narrowest column", () => {
    expect(ruleOf(".careBody")).toContain("flex: 1 1 var(--care-body-basis);");
    expect(ruleOf(".careBody")).toContain("min-width: 0;");
    expect(ruleOf(".careBody")).toContain("overflow-wrap: anywhere;");
    expect(COMPUTER).toContain("--care-body-basis: var(--card-min-width);");
  });

  it("keeps the category beside the resident on a computer and on a line of its own on a phone", () => {
    expect(COMPUTER).toContain("--care-status-basis: auto;");
    expect(PHONE).toContain("--care-status-basis: 100%;");
    expect(PHONE).toContain("--care-body-basis: 100%;");
  });
});
