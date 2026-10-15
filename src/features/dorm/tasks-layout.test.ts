import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { browserFilesIn, databaseCodeReachedFrom } from "@/ui/browser-code";

const FOLDER = "src/features/dorm";

function read(name: string): string {
  return readFileSync(`${FOLDER}/${name}`, "utf8");
}

/** What a rule of a style file holds, without the breaks between its lines. */
function ruleOf(file: string, selector: string): string {
  // Starts with a break, so the first rule is found like every other.
  const styles = `\n${read(file)}`;
  const start = styles.indexOf(`\n${selector} {`);
  if (start === -1) return "";
  const body = styles.slice(start, styles.indexOf("}", start));
  return body.replace(/\s+/g, " ");
}

describe("Tugas saya on a phone", () => {
  it("folds the number cards onto more rows, one a row at the narrowest", () => {
    expect(read("task-numbers.tsx")).toContain(
      "<ul className={styles.numbers}>",
    );
    expect(ruleOf("tasks.module.css", ".numbers")).toContain(
      "minmax(min(100%, var(--box-min-width)), 1fr)",
    );
    expect(ruleOf("tasks.module.css", ".number,\n.numberOn")).toContain(
      "min-width: 0;",
    );
    expect(ruleOf("tasks.module.css", ".number,\n.numberOn")).toContain(
      "overflow-wrap: anywhere;",
    );
  });

  it("stacks the cards of a section in one column, as on Perizinan asrama", () => {
    expect(read("task-cards.tsx")).toContain("<ul className={styles.cards}>");
    expect(ruleOf("leave.module.css", ".cards")).toContain(
      "minmax(min(100%, var(--column-min-width)), 1fr)",
    );
    expect(ruleOf("leave.module.css", ".card")).toContain(
      "overflow-wrap: anywhere;",
    );
  });

  it("folds the head of a section, and keeps the photo of a report within its card", () => {
    expect(ruleOf("tasks.module.css", ".sectionHead")).toContain(
      "flex-wrap: wrap;",
    );
    expect(ruleOf("tasks.module.css", ".sectionHead > div")).toContain(
      "min-width: 0;",
    );
    expect(ruleOf("tasks.module.css", ".photo")).toContain(
      "max-width: var(--card-min-width);",
    );
  });
});

describe("the screen parts of Tugas saya that run in the browser", () => {
  const PARTS = [
    `${FOLDER}/clarification-tasks.tsx`,
    `${FOLDER}/cleaning-tasks.tsx`,
    `${FOLDER}/leave-tasks.tsx`,
    `${FOLDER}/return-tasks.tsx`,
    `${FOLDER}/task-cards.tsx`,
    `${FOLDER}/task-decide.tsx`,
  ];

  it("are found", () => {
    const browserFiles = browserFilesIn(FOLDER);

    for (const path of PARTS) expect(browserFiles).toContain(path);
  });

  it.each(PARTS)("%s takes no database code along", (path) => {
    expect(databaseCodeReachedFrom(path)).toEqual([]);
  });
});
