import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const FOLDER = "src/features/mentor-groups";

/** The button of a form with what switches it off, as the screen code writes it. */
function buttonOf(file: string, words: string): string {
  const code = readFileSync(`${FOLDER}/${file}`, "utf8");
  const end = code.indexOf(words);
  if (end === -1) return "";
  return code.slice(code.lastIndexOf("<button", end), end);
}

describe("a button pressed twice on the screen", () => {
  it("switches Tetapkan penggantian off while the save is on its way", () => {
    const form = readFileSync(`${FOLDER}/replacement-form.tsx`, "utf8");
    const button = buttonOf("replacement-form.tsx", "Tetapkan penggantian");

    expect(form).toContain(
      "const [state, save, pending] = useSaveState(saveReplacementAction, START);",
    );
    expect(button).toMatch(/disabled=\{\s*pending \|\|/);
  });

  it("switches Batalkan off while the cancel is on its way", () => {
    const form = readFileSync(
      `${FOLDER}/cancel-replacement-button.tsx`,
      "utf8",
    );
    const button = buttonOf("cancel-replacement-button.tsx", "Batalkan\n");

    expect(form).toMatch(
      /const \[state, action, pending\] = useSaveState\(\s*cancelReplacementAction,/,
    );
    expect(button).toContain("disabled={pending}");
  });
});
