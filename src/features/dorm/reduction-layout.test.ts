import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const FOLDER = "src/features/dorm";

function read(name: string): string {
  return readFileSync(`${FOLDER}/${name}`, "utf8");
}

describe("the forms that reduce violations, on a phone", () => {
  const ONE = read("reduce-one-form.tsx");
  const MANY = read("reduce-many-form.tsx");
  const TABLE = read("reducible-table.tsx");

  it("lay the reason out on the shared form grid, which is one column at phone width, never wider than its room", () => {
    for (const form of [ONE, MANY]) {
      expect(form).toMatch(/className=\{`?\$?\{?shared\.form/);
      expect(form).not.toMatch(/className=\{shared\.field\}/);
      expect(form).toMatch(
        /\$\{shared\.field\} \$\{styles\.field\} \$\{styles\.full\}/,
      );
    }
  });

  it("show the violations with their ticks or buttons as cards that name every value", () => {
    for (const list of [MANY, TABLE]) {
      expect(list).toMatch(/<table className=.*shared\.stacked/);
    }
    expect(MANY).toContain('data-title="Kurangi"');
    expect(TABLE).toContain('data-title="Pengurangan"');
  });

  it("sends Batalkan through the sender that answers a lost request, once at a time", () => {
    const UNDO = read("reductions-table.tsx");
    expect(UNDO).toContain("onAnswer(await sendUndo(id, EDGES));");
    expect(UNDO).toContain("rethrow: unstable_rethrow,");
    expect(UNDO).toContain("if (isOnItsWay.current) return;");
    expect(UNDO).not.toContain("await undoReductionAction(");
  });

  it("ask before reducing", () => {
    expect(ONE).toContain(
      "if (!window.confirm(reduceOneQuestion(day, name))) return;",
    );
    expect(MANY).toContain(
      "if (!window.confirm(reduceManyQuestion(picked.length, name, left))) return;",
    );
  });
});
