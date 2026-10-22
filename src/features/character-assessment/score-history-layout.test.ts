import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const FOLDER = "src/features/character-assessment";
// Starts with a break, so the first rule is found like every other.
const STYLES = `\n${readFileSync(`${FOLDER}/score-history.module.css`, "utf8")}`;
const VIEW = readFileSync(`${FOLDER}/score-history-view.tsx`, "utf8");

/** What a rule of the style file holds, without the breaks between its lines. */
function ruleOf(selector: string): string {
  const start = STYLES.indexOf(`\n${selector} {`);
  if (start === -1) return "";
  const body = STYLES.slice(start, STYLES.indexOf("}", start));
  return body.replace(/\s+/g, " ");
}

describe("Riwayat per semester on a phone", () => {
  it("shrinks the chart to the width of the screen, keeping its proportions", () => {
    expect(VIEW).toContain("viewBox={VIEW_BOX}");
    expect(VIEW).not.toMatch(/<svg[^>]*\swidth=/);
    const chart = ruleOf(".chart");
    expect(chart).toContain("width: 100%;");
    expect(chart).toContain("max-width: var(--history-chart-width);");
    expect(chart).toContain("height: auto;");
  });

  it("shows each semester of the table as a small card that names every number", () => {
    expect(VIEW).toMatch(/<table className=.*shared\.stacked/);
    expect(VIEW).toContain('data-title="Semester"');
    expect(VIEW).toContain('data-title="Rerata"');
    expect(VIEW).toContain("data-title={name}");
  });

  it("lets the legend wrap and forces no width wider than a phone", () => {
    expect(ruleOf(".legend")).toContain("flex-wrap: wrap;");
    for (const selector of [".legend", ".legend li", ".chart"]) {
      const rule = ruleOf(selector);
      expect(rule, selector).not.toBe("");
      expect(rule, selector).not.toMatch(/min-width: (?!0;)/);
      expect(rule, selector).not.toContain("nowrap");
    }
    expect(VIEW).not.toContain("style=");
  });
});
