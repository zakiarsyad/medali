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
const FILE_BOX = `\n${readFileSync("src/clarifications/clarification-file-dialog.module.css", "utf8")}`;

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
    expect(ruleOf(FILE_BOX, ".fileHead")).toContain("flex-wrap: wrap;");
  });

  it("gives the Catatan and each decision the whole width of the card and more height, by the look the photo cards already have for a phone", () => {
    const view = readFileSync(
      `${FOLDER}/clarification-decide-view.tsx`,
      "utf8",
    );
    const shared = stylesOf("verification.module.css");

    expect(view).toContain('import styles from "./verification.module.css";');
    expect(view).toContain("className={styles.decide}");
    expect(view.match(/styles\.decideControl/g)).toHaveLength(2);
    expect(ruleOf(shared, ".decide .decideControl")).toContain(
      "flex: 1 1 var(--decide-control-basis);",
    );
  });

  it("keeps a shown file inside its box", () => {
    expect(ruleOf(FILE_BOX, ".fileFrame")).toContain("width: 100%;");
    expect(ruleOf(FILE_BOX, ".filePicture")).toContain("max-width: 100%;");
    expect(ruleOf(FILE_BOX, ".filePicture")).toContain(
      "max-height: var(--file-preview-height);",
    );
  });
});
