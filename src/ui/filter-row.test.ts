import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { sourceFilesEndingWith } from "./source-files";

const SHARED_STYLES = "src/ui/data-screen.module.css";
const RULE_ON_A_FILTER_ROW = /(^|[\s,}])\.filters[\s>{.:[]/;

function ruleOf(file: string, selector: string): string {
  const styles = `\n${readFileSync(file, "utf8")}`;
  const start = styles.indexOf(`\n${selector} {`);
  if (start === -1) return "";
  return styles.slice(start, styles.indexOf("}", start)).replace(/\s+/g, " ");
}

describe("the shared row of filters above a list", () => {
  it("never lets a field in it be wider than the room its panel has", () => {
    const field = ruleOf(SHARED_STYLES, ".filters > *");

    expect(field).toContain("min-width: 0;");
    expect(field).toContain("max-width: 100%;");
  });

  it("holds the fields of every list that uses it, with no rule of the list's own", () => {
    const stylesWithARowRule = sourceFilesEndingWith(".css").filter((path) =>
      RULE_ON_A_FILTER_ROW.test(readFileSync(path, "utf8")),
    );

    expect(stylesWithARowRule).toEqual([SHARED_STYLES]);
  });
});
