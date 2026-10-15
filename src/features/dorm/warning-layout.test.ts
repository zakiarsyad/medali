import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const FOLDER = "src/features/dorm";

function read(name: string): string {
  return readFileSync(`${FOLDER}/${name}`, "utf8");
}

describe("Proses of a call on a phone", () => {
  const BOX = read("warning-process-dialog.tsx");
  const SCHEDULE = read("call-schedule-form.tsx");
  const ISSUE = read("issue-letter-form.tsx");

  it("lays its parts and fields out on the shared form grid, which is one column at phone width", () => {
    for (const form of [BOX, SCHEDULE, ISSUE]) {
      expect(form).toContain("<div className={shared.form}>");
    }
  });

  it("never lets a field be wider than its room", () => {
    for (const form of [SCHEDULE, ISSUE]) {
      expect(form).not.toMatch(/className=\{shared\.field\}/);
      expect(form).toMatch(/\$\{shared\.field\} \$\{styles\.field\}/);
    }
    expect(BOX).toContain("<section className={styles.field}>");
  });

  it("asks before issuing an SP, which cannot be undone", () => {
    expect(ISSUE).toContain(
      "if (!window.confirm(issueQuestion(name, level))) return;",
    );
  });

  it("shows its lists as cards that name every value", () => {
    const REJECTED = read("rejected-table.tsx");
    expect(REJECTED).toMatch(/<table className=.*shared\.stacked/);
    for (const title of [
      "Tanggal",
      "Kegiatan",
      "Alasan klarifikasi",
      "Ditolak oleh",
    ]) {
      expect(REJECTED).toContain(`data-title="${title}"`);
    }
  });
});
