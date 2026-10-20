import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const STYLES = readFileSync(
  "src/features/students/own-survey.module.css",
  "utf8",
);
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

describe("the survey on Profil saya on a phone", () => {
  it("puts each statement above its five buttons: the statement takes the whole width", () => {
    expect(ruleOf(".statement")).toContain("flex-wrap: wrap;");
    expect(ruleOf(".statement > span")).toContain(
      "flex: 1 1 var(--statement-text-basis);",
    );
    expect(COMPUTER).toContain(
      "--statement-text-basis: var(--card-min-width);",
    );
    expect(PHONE).toContain("--statement-text-basis: 100%;");
  });

  it("spreads the five buttons over the width, each large enough for a thumb", () => {
    expect(ruleOf(".scores")).toContain("flex: 0 1 var(--scores-width);");
    expect(ruleOf(".score")).toContain("flex: var(--score-button-grow) 1 0;");
    expect(ruleOf(".score")).toContain("min-height: var(--score-button-size);");
    expect(COMPUTER).toContain("--score-button-size: 38px;");
    expect(PHONE).toContain("--score-button-size: 44px;");
    expect(PHONE).toContain("--scores-width: 100%;");
    expect(PHONE).toContain("--score-button-grow: 1;");
  });

  it("never lets a statement or the suggestion push the card wider than the screen", () => {
    expect(ruleOf(".statement > span")).toContain("min-width: 0;");
    expect(ruleOf(".bottom textarea")).toContain("overflow-wrap: anywhere;");
    expect(ruleOf(".head > div")).toContain("min-width: 0;");
    expect(ruleOf(".head")).toContain("flex-wrap: wrap;");
  });
});
