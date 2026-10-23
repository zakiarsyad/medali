import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const FOLDER = "src/features/siku";
// Starts with a break, so the first rule is found like every other.
const STYLES = `\n${readFileSync(`${FOLDER}/siku.module.css`, "utf8")}`;
const BREAKDOWN = readFileSync(`${FOLDER}/siku-breakdown.tsx`, "utf8");
const VIEW = readFileSync(`${FOLDER}/student-siku-view.tsx`, "utf8");
const OWN = readFileSync(`${FOLDER}/own-siku-panel.tsx`, "utf8");

/** What a rule of the style file holds, without the breaks between its lines. */
function ruleOf(selector: string): string {
  const start = STYLES.indexOf(`\n${selector} {`);
  if (start === -1) return "";
  const body = STYLES.slice(start, STYLES.indexOf("}", start));
  return body.replace(/\s+/g, " ");
}

/** The rules of the style file that "Rincian nilai SIKU" and "Transparansi nilai SIKU" use. */
const PANEL_RULES = [
  ".sum",
  ".sum > div",
  ".sum small",
  ".sum b",
  ".sign",
  ".total",
  ".gain",
  ".loss",
  ".strong",
  ".subheading",
  ".more",
  ".panelHead",
  ".spaced",
  ".list",
  ".sub",
];

describe("Rincian nilai SIKU and Transparansi nilai SIKU on a phone", () => {
  it("wraps the sum Nilai dasar + Penambahan − Pengurangan = SIKU akhir onto several lines", () => {
    expect(BREAKDOWN).toContain("<div className={styles.sum}>");
    expect(ruleOf(".sum")).toContain("display: flex;");
    expect(ruleOf(".sum")).toContain("flex-wrap: wrap;");
  });

  it("shows each line as a small card that names every value", () => {
    expect(BREAKDOWN).toMatch(/<table className=.*shared\.stacked/);
    for (const title of [
      "Tanggal",
      "Alasan",
      "Keterangan",
      "Dicatat oleh",
      "Poin",
    ]) {
      expect(BREAKDOWN).toContain(`data-title="${title}"`);
    }
  });

  it("lets the head of Transparansi nilai SIKU wrap its weight under the title", () => {
    expect(OWN).toContain("<div className={styles.panelHead}>");
    expect(ruleOf(".panelHead")).toContain("flex-wrap: wrap;");
  });

  it("forces no width wider than a phone", () => {
    for (const selector of PANEL_RULES) {
      const rule = ruleOf(selector);
      expect(rule, selector).not.toBe("");
      expect(rule, selector).not.toMatch(/(^|[ ;{])width:/);
      expect(rule, selector).not.toMatch(/min-width: (?!0;)/);
      expect(rule, selector).not.toContain("nowrap");
    }
    for (const code of [BREAKDOWN, VIEW, OWN]) {
      expect(code).not.toContain("style=");
    }
  });
});
