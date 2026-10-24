import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { contrastRatio } from "./contrast";
import {
  closeTextSizes,
  inForce,
  namedValuesIn,
  resolvedValue,
  sameColourNames,
  tokenBlocks,
} from "./tokens-read";

const TOKENS = tokenBlocks(readFileSync("src/ui/tokens.css", "utf8"));
const PHONE = inForce(TOKENS.light, TOKENS.phone);
const BADGE_KINDS = ["good", "warning", "bad", "plain"];
const MUTED = "#5a6577";

const PART_VALUES: [string, string][] = [
  ["--field-text", "15px"],
  ["--field-weight", "400"],
  ["--field-height", "40px"],
  ["--button-text", "15px"],
  ["--button-weight", "600"],
  ["--button-height", "40px"],
  ["--button-padding", "6px 12px"],
  ["--card-padding", "12px 16px"],
  ["--card-radius", "14px"],
  ["--card-shadow", "none"],
  ["--card-gap", "8px"],
  ["--note-padding", "8px 12px"],
  ["--note-text", "13px"],
  ["--note-ink", MUTED],
  ["--note-line", "1px"],
  ["--note-line-colour", "#dce2eb"],
  ["--section-heading-text", "15px"],
  ["--section-heading-weight", "800"],
  ["--section-heading-ink", "#13264a"],
  ["--empty-list-text", "15px"],
  ["--empty-list-ink", MUTED],
  ["--empty-list-align", "center"],
  ["--empty-list-padding", "24px"],
  ["--empty-section-text", "13px"],
  ["--empty-section-ink", MUTED],
  ["--empty-section-align", "left"],
  ["--empty-section-padding", "0"],
  ["--below-tabs", "24px"],
  ["--below-lede", "24px"],
  ["--tap-size", "44px"],
  ["--content-max-width", "1440px"],
];

function values(entries: Record<string, string>): Map<string, string> {
  return new Map(Object.entries(entries));
}

describe("tokenBlocks", () => {
  it("reads the light, phone and dark values apart", () => {
    const blocks = tokenBlocks(`
      :root { --a: 1px; /* --b: 9px; */ --c: calc(
        1px + 2px
      ); }
      @media (max-width: 860px) { :root { --a: 2px; } }
      @media (prefers-color-scheme: dark) { :root { --d: #000; } }
    `);

    expect(blocks.light).toEqual(
      values({ "--a": "1px", "--c": "calc( 1px + 2px )" }),
    );
    expect(blocks.phone).toEqual(values({ "--a": "2px" }));
    expect(blocks.dark).toEqual(values({ "--d": "#000" }));
  });

  it("refuses a file without its phone part", () => {
    expect(() => tokenBlocks(":root { --a: 1px; }")).toThrow();
  });
});

describe("sameColourNames", () => {
  it("finds two names with the same colour in light and in dark mode", () => {
    const light = values({ "--a": "#ABCDEF", "--b": "#abcdef", "--c": "#111" });

    expect(sameColourNames(light, new Map())).toEqual([["--a", "--b"]]);
  });

  it("keeps apart two names that differ in dark mode", () => {
    const light = values({ "--a": "#abcdef", "--b": "#abcdef" });

    expect(sameColourNames(light, values({ "--a": "#000" }))).toEqual([]);
  });

  it("compares colour functions without their spaces", () => {
    const light = values({
      "--a": "rgba(0, 0, 0, 0.1)",
      "--b": "rgba(0,0,0,0.1)",
    });

    expect(sameColourNames(light, new Map())).toEqual([["--a", "--b"]]);
  });

  it("leaves out names that only point at another name", () => {
    const light = values({ "--a": "#abcdef", "--b": "var(--a)" });

    expect(sameColourNames(light, new Map())).toEqual([]);
  });
});

describe("closeTextSizes", () => {
  it("finds text sizes less than 1px apart, and no other sizes", () => {
    const sizes = namedValuesIn(`
      --text-a: 12.5px; --text-b: 13px; --text-c: 14px; --space-a: 13.5px;
    `);

    expect(closeTextSizes(sizes)).toEqual([["--text-a", "--text-b"]]);
  });
});

describe("resolvedValue", () => {
  it("replaces every name a value points at, through more than one step", () => {
    const named = values({
      "--a": "4px",
      "--b": "var(--a)",
      "--c": "var(--b) var(--a) solid",
    });

    expect(resolvedValue("--c", named)).toBe("4px 4px solid");
  });

  it("refuses a name that is not there", () => {
    expect(() => resolvedValue("--b", values({ "--a": "var(--b)" }))).toThrow();
  });
});

describe("the shared set of UI values", () => {
  it.each(PART_VALUES)("names %s as %s", (name, value) => {
    expect(resolvedValue(name, TOKENS.light)).toBe(value);
  });

  /*
   * Checked at computer width in light mode: dark mode is left as it is
   * for now, and its surfaces do not yet give the status colours this
   * contrast.
   */
  it.each(BADGE_KINDS)(
    "gives the %s badge a text, background and border colour, its text at a contrast of 4.5 or more",
    (kind) => {
      const ink = resolvedValue(`--badge-${kind}-ink`, TOKENS.light);
      const background = resolvedValue(`--badge-${kind}-bg`, TOKENS.light);

      expect(resolvedValue(`--badge-${kind}-line`, TOKENS.light)).toMatch(/^#/);
      expect(contrastRatio(ink, background)).toBeGreaterThanOrEqual(4.5);
    },
  );

  it("holds no two colour names with the same colour in light and dark mode", () => {
    expect(sameColourNames(TOKENS.light, TOKENS.dark)).toEqual([]);
  });

  it("holds no two text sizes less than 1px apart at computer width", () => {
    expect(closeTextSizes(TOKENS.light)).toEqual([]);
  });

  it("holds no two text sizes less than 1px apart on a phone", () => {
    expect(closeTextSizes(PHONE)).toEqual([]);
  });
});
