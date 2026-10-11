import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { findLooseValues } from "./loose-values";
import { sourceFilesEndingWith } from "./source-files";

const TOKENS_FILE = "src/ui/tokens.css";

function screenStylesheets(): string[] {
  return sourceFilesEndingWith(".css").filter((path) => path !== TOKENS_FILE);
}

describe("findLooseValues", () => {
  it("finds nothing in styles that use only named values", () => {
    const stylesheet = `
      /* 12px in a comment is fine */
      .box:hover {
        padding: 0 var(--space-md);
        width: 100%;
        flex: 1;
        grid-template-columns: var(--side-width) 1fr;
        border: var(--line-width) solid var(--line);
        font-family: var(--font-body);
        font-weight: var(--weight-semibold);
        z-index: var(--layer-top-bar);
        background: none;
        outline-color: transparent;
        stroke: currentColor;
      }
    `;

    expect(findLooseValues(stylesheet)).toEqual([]);
  });

  it.each([
    ["font: inherit;"],
    ["font-family: inherit;"],
    ["font-family: initial;"],
    ["font: unset;"],
    ["font-size: inherit;"],
    ["line-height: inherit;"],
  ])("allows %s", (declaration) => {
    expect(findLooseValues(`.box { ${declaration} }`)).toEqual([]);
  });

  it.each([
    ["a hex colour", "color: #13264a;", ["#13264a"]],
    ["a colour function", "color: rgba(0, 0, 0, 0.5);", ["rgba("]],
    ["a colour word", "color: white;", ["white"]],
    ["a colour word after other words", "border: solid red;", ["red"]],
    ["a colour word in a shadow", "box-shadow: 0 0 0 2 black;", ["black"]],
    ["a less common colour word", "color: rebeccapurple;", ["rebeccapurple"]],
    ["a size in px", "padding: 12px;", ["12px"]],
    ["a size in rem", "margin: 1.5rem;", ["1.5rem"]],
    ["a size in em", "letter-spacing: .06em;", [".06em"]],
    ["a size in vh", "height: 100vh;", ["100vh"]],
    ["a size in dvh", "height: 100dvh;", ["100dvh"]],
    ["a size in svh", "height: 50svh;", ["50svh"]],
    ["a size in lvh", "height: 50lvh;", ["50lvh"]],
    ["a size in cm", "width: 2cm;", ["2cm"]],
    ["a size in mm", "width: 5mm;", ["5mm"]],
    ["a size in inches", "width: 1in;", ["1in"]],
    ["a size in ex", "width: 3ex;", ["3ex"]],
    ["a size in lh", "margin: 2lh;", ["2lh"]],
    ["a size in a container unit", "width: 50cqw;", ["50cqw"]],
    ["a size inside calc", "width: calc(100% - 4px);", ["4px"]],
    ["a negative size", "margin: -4px;", ["-4px"]],
    ["a negative size without a zero", "letter-spacing: -.02em;", ["-.02em"]],
    [
      "a negative size in a function",
      "transform: translateX(-12px);",
      ["-12px"],
    ],
    ["a duration", "transition: opacity 200ms;", ["200ms"]],
    ["a font name", "font-family: Arial;", ["font-family: Arial"]],
    ["a font shorthand", "font: bold 12px Arial;", ["font: bold 12px Arial"]],
    ["a font weight number", "font-weight: 700;", ["font-weight: 700"]],
    ["a font weight word", "font-weight: bold;", ["font-weight: bold"]],
    ["a font size word", "font-size: large;", ["font-size: large"]],
    ["a line height number", "line-height: 1.5;", ["line-height: 1.5"]],
    ["a layer number", "z-index: 20;", ["z-index: 20"]],
  ])("finds %s", (_kind, declaration, found) => {
    expect(findLooseValues(`.box { ${declaration} }`)).toEqual(found);
  });

  it("finds a loose value next to a named one", () => {
    expect(findLooseValues(".box { margin: var(--space-md) 4px; }")).toEqual([
      "4px",
    ]);
  });

  it.each([
    [
      "a media rule",
      "@media (max-width: 600px) { .box { display: none; } }",
      ["@media (max-width: 600px)"],
    ],
    [
      "a media rule without a size",
      "@media (prefers-color-scheme: dark) { .box { display: none; } }",
      ["@media (prefers-color-scheme: dark)"],
    ],
    [
      "a container rule",
      "@container (min-width: 40em) { .box { display: none; } }",
      ["@container (min-width: 40em)"],
    ],
  ])("finds %s", (_kind, stylesheet, found) => {
    expect(findLooseValues(stylesheet)).toEqual(found);
  });

  it("finds a font name after a named font", () => {
    expect(
      findLooseValues(".box { font-family: var(--font-body), Arial; }"),
    ).toEqual(["font-family: , Arial"]);
  });
});

describe("screen styles", () => {
  const stylesheets = screenStylesheets();

  it("has style files to check", () => {
    expect(stylesheets.length).toBeGreaterThan(0);
  });

  it.each(stylesheets)("%s holds no loose value", (path) => {
    expect(findLooseValues(readFileSync(path, "utf8"))).toEqual([]);
  });
});
