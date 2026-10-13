import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const SHARED_FILE = "src/ui/data-screen.module.css";
const FORM_RULE = /\.form\s*\{([^}]*)\}/;
const COLUMNS = /grid-template-columns:\s*([^;]*);/;
const COLUMN_NEVER_WIDER_THAN_ITS_ROOM =
  "repeat(auto-fit, minmax(min(var(--card-min-width), 100%), 1fr))";

function onOneLine(value: string | undefined): string | undefined {
  return value?.replace(/\s+/g, " ").replace(/\( /g, "(").replace(/ \)/g, ")");
}

describe("the shared form grid", () => {
  it("never asks for a column wider than the room it has", () => {
    const rule = readFileSync(SHARED_FILE, "utf8").match(FORM_RULE);
    const columns = rule?.[1]?.match(COLUMNS);

    expect(onOneLine(columns?.[1])).toBe(COLUMN_NEVER_WIDER_THAN_ITS_ROOM);
  });
});
