import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LevelBars } from "./level-bars";

// Starts with a break, so the first rule is found like every other.
const STYLES = `\n${readFileSync("src/mental-health/mental-health.module.css", "utf8")}`;

/** What a rule of the style file holds, without the breaks between its lines. */
function ruleOf(selector: string): string {
  const start = STYLES.indexOf(`\n${selector} {`);
  if (start === -1) return "";
  const body = STYLES.slice(start, STYLES.indexOf("}", start));
  return body.replace(/\s+/g, " ").replace(/\( /g, "(").replace(/ \)/g, ")");
}

describe("LevelBars", () => {
  it("draws a bar per level as sent, with no bar for a level sent as <5", () => {
    const html = renderToStaticMarkup(
      <LevelBars
        byLevel={{
          normal: 20,
          mild: 8,
          moderate: "<5",
          severe: 0,
          extremely_severe: 0,
        }}
      />,
    );

    expect(html.match(/<meter/g)).toHaveLength(5);
    for (const words of ["Normal", "Ringan", "Sedang", "Berat"]) {
      expect(html).toContain(words);
    }
    expect(html).toContain('max="20" value="20"');
    expect(html).toContain('value="0" aria-label="Sedang"');
    expect(html).toContain(">&lt;5</span>");
  });

  it("lets every column of a bar shrink, so a bar never widens its panel on a phone", () => {
    expect(ruleOf(".levelBar")).toContain(
      "grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto;",
    );
    expect(ruleOf(".levelLabel")).toContain("overflow-wrap: anywhere;");
    for (const selector of [".levelBars", ".levelBar", ".levelLabel"]) {
      const rule = ruleOf(selector);
      expect(rule, selector).not.toBe("");
      expect(rule, selector).not.toMatch(/(^|[ ;{])width:/);
      expect(rule, selector).not.toContain("nowrap");
    }
  });
});
