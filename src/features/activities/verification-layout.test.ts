import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const FOLDER = "src/features/activities";
// Starts with a break, so the first rule is found like every other.
const STYLES = `\n${readFileSync(`${FOLDER}/verification.module.css`, "utf8")}`;

/** What a rule of the style file holds, without the breaks between its lines. */
function ruleOf(selector: string): string {
  const start = STYLES.indexOf(`\n${selector} {`);
  if (start === -1) return "";
  const body = STYLES.slice(start, STYLES.indexOf("}", start));
  return body.replace(/\s+/g, " ");
}

describe("the tab Verifikasi presensi on a phone", () => {
  it("puts the cards in one column: a card is never wider than the screen", () => {
    expect(ruleOf(".photoCards")).toContain("display: grid;");
    expect(ruleOf(".photoCards")).toContain(
      "minmax(min(100%, var(--card-min-width)), 1fr)",
    );
    expect(ruleOf(".photoCard")).toContain("min-width: 0;");
  });

  it("folds a long name, and keeps a picture inside its card, instead of widening the page", () => {
    expect(ruleOf(".photoCard")).toContain("overflow-wrap: anywhere;");
    expect(ruleOf(".photo,\n.noPhoto")).toContain("width: 100%;");
    expect(ruleOf(".decision")).toContain("flex-wrap: wrap;");
  });

  it("gives each thing a card offers to decide the whole width of the card and more height, through the names for phone width", () => {
    const control = ruleOf(".decide .decideControl");
    const tokens = readFileSync("src/ui/tokens.css", "utf8");
    const atPhoneWidth = tokens.slice(tokens.indexOf("@media (max-width"));

    expect(ruleOf(".decide")).toContain("flex-wrap: wrap;");
    expect(control).toContain("flex: 1 1 var(--decide-control-basis);");
    expect(control).toContain("padding-top: var(--decide-control-padding);");
    expect(control).toContain("max-width: 100%;");
    expect(atPhoneWidth).toContain("--decide-control-basis: 100%;");
    expect(atPhoneWidth).toContain(
      "--decide-control-padding: var(--space-md);",
    );
  });
});
