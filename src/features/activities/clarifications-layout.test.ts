import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const FOLDER = "src/features/activities";

/** A style file, starting with a break so its first rule is found like every other. */
function stylesOf(name: string): string {
  return `\n${readFileSync(`${FOLDER}/${name}`, "utf8")}`;
}

/** What a rule of a style file holds, without the breaks between its lines. */
function ruleOf(styles: string, selector: string): string {
  const start = styles.indexOf(`\n${selector} {`);
  if (start === -1) return "";
  const body = styles.slice(start, styles.indexOf("}", start));
  return body.replace(/\s+/g, " ");
}

const OWN = stylesOf("clarifications.module.css");
const BASE = stylesOf("activities.module.css");

describe("the tab Klarifikasi kehadiran on a phone", () => {
  it("puts the cards in one column: a card is never wider than the screen", () => {
    expect(ruleOf(BASE, ".cards")).toContain(
      "minmax(min(100%, var(--column-min-width)), 1fr)",
    );
    expect(ruleOf(BASE, ".card")).toContain("min-width: 0;");
  });

  it("puts the facts of a card under each other where there is no room beside", () => {
    expect(ruleOf(OWN, ".facts")).toContain(
      "minmax(min(100%, var(--box-min-width)), 1fr)",
    );
    expect(ruleOf(OWN, ".fact")).toContain("min-width: 0;");
  });

  it("folds a long name, explanation or file name instead of widening the page", () => {
    expect(ruleOf(BASE, ".card")).toContain("overflow-wrap: anywhere;");
    expect(ruleOf(OWN, ".fileName")).toContain("overflow-wrap: anywhere;");
    expect(ruleOf(OWN, ".fileName")).toContain("max-width: 100%;");
    expect(ruleOf(OWN, ".fileHead")).toContain("flex-wrap: wrap;");
  });

  it("keeps the search and the status choice as narrow as the screen", () => {
    const fields = ruleOf(OWN, ".filters input,\n.filters select");

    expect(fields).toContain("max-width: 100%;");
    expect(fields).toContain("min-width: 0;");
  });

  it("keeps a shown file inside its box", () => {
    expect(ruleOf(OWN, ".fileFrame")).toContain("width: 100%;");
    expect(ruleOf(OWN, ".filePicture")).toContain("max-width: 100%;");
    expect(ruleOf(OWN, ".filePicture")).toContain(
      "max-height: var(--file-preview-height);",
    );
  });
});
