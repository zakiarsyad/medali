import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  closeTextSizes,
  inForce,
  namedValuesIn,
  sameColourNames,
  tokenBlocks,
} from "./tokens-read";

const TOKENS = tokenBlocks(readFileSync("src/ui/tokens.css", "utf8"));
const PHONE = inForce(TOKENS.light, TOKENS.phone);

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

describe("the shared set of UI values", () => {
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
