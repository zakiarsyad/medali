import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const STYLES = readFileSync("src/ui/data-screen.module.css", "utf8");
const TABLE = readFileSync("src/features/accounts/access-matrix.tsx", "utf8");
const TOKENS = readFileSync("src/ui/tokens.css", "utf8");
const PHONE_START = TOKENS.indexOf("@media (max-width:");
const AT_ANY_WIDTH = TOKENS.slice(0, PHONE_START);
const ON_A_PHONE = TOKENS.slice(
  PHONE_START,
  TOKENS.indexOf("@media (prefers-color-scheme:"),
);

/** What a rule of the style file holds, without the breaks between its lines. */
function ruleOf(selector: string): string {
  const start = STYLES.indexOf(`\n${selector} {`);
  if (start === -1) return "";
  const body = STYLES.slice(start, STYLES.indexOf("}", start));
  return body.replace(/\s+/g, " ");
}

function placeOf(selector: string): number {
  return STYLES.indexOf(`\n${selector} {`);
}

describe("Hak akses tiap peran on a phone", () => {
  it("is one block per role, as the other lists of the app are on a phone", () => {
    expect(TABLE).toMatch(/<table\s+className=.*styles\.stacked/);
  });

  it("has the role name as the heading of its block, larger and with no title beside it", () => {
    const heading = ruleOf(".stacked td.rowHeading");

    expect(TABLE).toMatch(
      /<td className=\{styles\.rowHeading\} data-title="Peran">\s*<b>\{ROLES\[role\]\.title\}<\/b>/,
    );
    expect(heading).toContain("padding: var(--stacked-actions-padding);");
    expect(heading).toContain("font-size: var(--stacked-heading-size);");
    expect(ruleOf(".stacked td.rowHeading::before")).toContain(
      "display: none;",
    );
    expect(AT_ANY_WIDTH).toContain("--stacked-heading-size: var(--text-md);");
    expect(ON_A_PHONE).toContain("--stacked-heading-size: var(--text-base);");
  });

  it("has Menu and Tindakan above their values, which take the whole width", () => {
    const cell = ruleOf(".titlesAbove td[data-title]");
    const title = ruleOf(".titlesAbove td[data-title]::before");

    expect(TABLE).toMatch(/<table\s+className=.*styles\.titlesAbove/);
    expect(TABLE).toContain('<td data-title="Menu">');
    expect(TABLE).toContain('<td data-title="Tindakan">');
    expect(cell).toContain("padding: var(--stacked-above-cell-padding);");
    expect(title).toContain("float: none;");
    expect(title).toContain("margin-left: 0;");
    expect(AT_ANY_WIDTH).toContain(
      "--stacked-above-cell-padding: var(--space-sm);",
    );
    expect(ON_A_PHONE).toContain(
      "--stacked-above-cell-padding: var(--space-2xs) 0;",
    );
  });

  it("lets the rule of the heading win over the rule of a titled cell, which is as strong", () => {
    const titled = placeOf(".titlesAbove td[data-title]");

    expect(titled).toBeGreaterThan(placeOf(".stacked td[data-title]::before"));
    expect(placeOf(".stacked td.rowHeading")).toBeGreaterThan(titled);
  });

  it("starts each right on its own line, and reads them as one sentence at any other width", () => {
    expect(TABLE).toContain("<ul className={styles.lines}>");
    expect(ruleOf(".lines li")).toContain(
      "display: var(--lines-item-display);",
    );
    expect(ruleOf(".lines li")).toContain(
      "padding: var(--lines-item-padding);",
    );
    expect(AT_ANY_WIDTH).toContain("--lines-item-display: inline;");
    expect(AT_ANY_WIDTH).toContain("--lines-item-padding: 0;");
    expect(ON_A_PHONE).toContain("--lines-item-display: block;");
    expect(ON_A_PHONE).toContain("--lines-item-padding: var(--space-3xs) 0;");
  });

  it("leaves out the commas between the rights, which stand at any other width", () => {
    expect(TABLE).toContain("<span className={styles.comma}>, </span>");
    expect(ruleOf(".comma")).toContain("display: var(--lines-comma-display);");
    expect(AT_ANY_WIDTH).toContain("--lines-comma-display: inline;");
    expect(ON_A_PHONE).toContain("--lines-comma-display: none;");
  });
});
