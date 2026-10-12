import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { sourceFilesEndingWith } from "./source-files";

const BASE_FILE = "src/ui/base.css";
const TOKENS_FILE = "src/ui/tokens.css";
const SWITCHED_OFF_RULE = /button:disabled\s*\{([^}]*)\}/;
const PALE_LOOK_VALUE = /--switched-off-opacity:\s*0?\.\d+;/;

function otherStylesheets(): string[] {
  return sourceFilesEndingWith(".css").filter((path) => path !== BASE_FILE);
}

describe("a switched-off button", () => {
  it("is paler than usual and loses the pressing hand, whatever its style", () => {
    const rule = readFileSync(BASE_FILE, "utf8").match(SWITCHED_OFF_RULE);

    expect(rule?.[1]).toContain("opacity: var(--switched-off-opacity);");
    expect(rule?.[1]).toContain("cursor: default;");
  });

  it("takes its pale look from a named value below full strength", () => {
    expect(readFileSync(TOKENS_FILE, "utf8")).toMatch(PALE_LOOK_VALUE);
  });

  it.each(otherStylesheets())("gets no second look in %s", (path) => {
    expect(readFileSync(path, "utf8")).not.toContain(":disabled");
  });
});
