import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const FOLDS = "overflow-wrap: anywhere;";

function ruleOf(file: string, selector: string): string {
  const styles = `\n${readFileSync(file, "utf8")}`;
  const start = styles.indexOf(`\n${selector} {`);
  if (start === -1) return "";
  return styles.slice(start, styles.indexOf("}", start)).replace(/\s+/g, " ");
}

describe("a name, a gelar or a unit typed as one long word", () => {
  it("folds in a cell of a list, between a least and a most width", () => {
    const typed = ruleOf("src/ui/data-screen.module.css", ".typed");

    expect(typed).toContain(FOLDS);
    expect(typed).toContain("min-width: var(--typed-min-width);");
    expect(typed).toContain("max-width: var(--typed-max-width);");
  });

  it("is marked as typed in both its columns of the staff list", () => {
    const list = readFileSync(
      "src/features/accounts/account-table.tsx",
      "utf8",
    );

    expect(list).toContain(
      "<b className={styles.typed}>{fullName(account)}</b>",
    );
    expect(list).toContain(
      '<span className={styles.typed}>{account.unit ?? "-"}</span>',
    );
  });

  it("folds in the message that names the account just saved", () => {
    expect(ruleOf("src/ui/data-screen.module.css", ".done")).toContain(FOLDS);
  });

  it.each([".name", ".detail"])(
    "folds in %s of a card on Ganti peran",
    (selector) => {
      expect(ruleOf("src/auth/account-picker.module.css", selector)).toContain(
        FOLDS,
      );
    },
  );

  it("folds beside the picture of who is signed in, in the menu", () => {
    const who = ruleOf("src/ui/account-box.module.css", ".who");

    expect(who).toContain(FOLDS);
    expect(who).toContain("min-width: 0;");
  });
});
