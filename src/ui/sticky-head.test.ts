import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { sourceFilesEndingWith } from "./source-files";

const STICKY_LIST = /\.stickyHead\b/;
const SIDEWAYS_BOX = /\.tableWrap\b/;

function ruleOf(file: string, selector: string): string {
  const styles = `\n${readFileSync(file, "utf8")}`;
  const start = styles.indexOf(`\n${selector} {`);
  if (start === -1) return "";
  return styles.slice(start, styles.indexOf("}", start)).replace(/\s+/g, " ");
}

describe("the headings of a list that stay in view", () => {
  const headings = ruleOf("src/ui/data-screen.module.css", ".stickyHead th");

  it("stop right under the top bar, which is as high as they are told", () => {
    const bar = ruleOf("src/ui/top-bar.module.css", ".top");

    expect(headings).toContain("position: sticky;");
    expect(headings).toContain("top: var(--top-bar-height);");
    expect(bar).toContain("min-height: var(--top-bar-height);");
  });

  it("cover the rows that pass under them", () => {
    expect(headings).toContain("background: var(--surface);");
  });
});

describe("lists whose headings stay in view", () => {
  const lists = sourceFilesEndingWith(".tsx").filter((path) =>
    STICKY_LIST.test(readFileSync(path, "utf8")),
  );

  it("include Hak akses tiap peran", () => {
    expect(lists).toContain("src/features/accounts/access-matrix.tsx");
  });

  it.each(lists)(
    "%s is not in a box that scrolls sideways, which would hold its headings back",
    (path) => {
      expect(SIDEWAYS_BOX.test(readFileSync(path, "utf8"))).toBe(false);
    },
  );
});
