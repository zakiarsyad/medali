import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const STYLES = readFileSync(
  "src/features/curriculum/curriculum.module.css",
  "utf8",
);

const INDICATOR_BOXES = readFileSync(
  "src/features/curriculum/indicator-boxes.tsx",
  "utf8",
);

const INDICATOR_TICK = readFileSync(
  "src/features/curriculum/indicator-tick.tsx",
  "utf8",
);

/** What a rule of the style file holds, without the breaks between its lines. */
function ruleOf(selector: string): string {
  const start = STYLES.indexOf(`${selector} {`);
  if (start === -1) return "";
  const body = STYLES.slice(start, STYLES.indexOf("}", start));
  return body.replace(/\s+/g, " ");
}

describe("a long word on Kurikulum", () => {
  it("folds inside its box in the indicators, the Penjabaran text, Kegiatan acuan and Indikator tahap", () => {
    for (const rule of [".indicatorText", ".breakdownText", ".plainList"]) {
      expect(ruleOf(rule)).toContain("overflow-wrap: anywhere;");
    }
  });

  it("lets the indicator text shrink beside its code, so it folds instead of widening the box", () => {
    expect(ruleOf(".indicatorText")).toContain("min-width: 0;");
    expect(INDICATOR_BOXES).toContain("className={styles.indicatorText}");
  });

  it("folds the indicator text of a tick in the Penjabaran and PPKS forms", () => {
    expect(INDICATOR_TICK).toContain(
      "<span className={styles.indicatorText}>{text}</span>",
    );
  });
});
