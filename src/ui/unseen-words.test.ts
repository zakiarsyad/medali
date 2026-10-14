import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { sourceFilesEndingWith } from "./source-files";

const SHARED_STYLES = "src/ui/data-screen.module.css";
const HIDES_FROM_SIGHT = /clip-path:\s*inset\(50%\)/;

function ruleOf(file: string, selector: string): string {
  const styles = `\n${readFileSync(file, "utf8")}`;
  const start = styles.indexOf(`\n${selector} {`);
  if (start === -1) return "";
  return styles.slice(start, styles.indexOf("}", start)).replace(/\s+/g, " ");
}

describe("words that only a screen reader gets, in a list that scrolls sideways", () => {
  it("are placed by the box that scrolls, so they stay inside it and never widen the page", () => {
    expect(ruleOf(SHARED_STYLES, ".hidden")).toContain("position: absolute;");
    expect(ruleOf(SHARED_STYLES, ".tableWrap")).toContain(
      "position: relative;",
    );
  });

  it("are hidden by the one shared style, which that box holds", () => {
    const hidingStyles = sourceFilesEndingWith(".css").filter((path) =>
      HIDES_FROM_SIGHT.test(readFileSync(path, "utf8")),
    );

    expect(hidingStyles).toEqual([SHARED_STYLES]);
  });
});
