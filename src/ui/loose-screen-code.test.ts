import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { findLooseValuesInScreenCode } from "./loose-screen-code";
import { sourceFilesEndingWith } from "./source-files";

describe("findLooseValuesInScreenCode", () => {
  it("finds nothing in code that takes its look from a style file", () => {
    const code = `
      <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" />
      </svg>
    `;

    expect(findLooseValuesInScreenCode(code)).toEqual([]);
  });

  it.each([
    ["a character code", "<span>Rp&#160;5.000</span>"],
    ["a longer character code", "<span>MEDALI &#8212; Kampus</span>"],
    ["a link to a part of the page", '<a href="#add">Tambah</a>'],
    ["a note with a number", "// see #123"],
  ])("allows %s", (_kind, code) => {
    expect(findLooseValuesInScreenCode(code)).toEqual([]);
  });

  it.each([
    ["an inline style", "<div style={{ padding: 4 }} />", ["style="]],
    ["a hex colour", '<path fill="#13264a" />', ['"#13264a"']],
    ["a short hex colour", 'const white = "#fff";', ['"#fff"']],
    ["a colour function", '<path fill="rgb(0 0 0)" />', ["rgb("]],
  ])("finds %s", (_kind, code, found) => {
    expect(findLooseValuesInScreenCode(code)).toEqual(found);
  });
});

describe("screen code", () => {
  const screens = sourceFilesEndingWith(".tsx");

  it("has screen files to check", () => {
    expect(screens.length).toBeGreaterThan(0);
  });

  it.each(screens)("%s holds no loose value", (path) => {
    expect(findLooseValuesInScreenCode(readFileSync(path, "utf8"))).toEqual([]);
  });
});
