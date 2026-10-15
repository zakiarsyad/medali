import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const FOLDER = "src/features/dorm";

function read(name: string): string {
  return readFileSync(`${FOLDER}/${name}`, "utf8");
}

describe("Proses of a call on a phone", () => {
  const BOX = read("warning-process-dialog.tsx");
  const SCHEDULE = read("call-schedule-form.tsx");

  it("lays its parts and fields out on the shared form grid, which is one column at phone width", () => {
    expect(BOX).toContain("<div className={shared.form}>");
    expect(SCHEDULE).toContain("<div className={shared.form}>");
  });

  it("never lets a field be wider than its room", () => {
    expect(SCHEDULE).not.toMatch(/className=\{shared\.field\}/);
    expect(SCHEDULE).toMatch(/\$\{shared\.field\} \$\{styles\.field\}/);
    expect(BOX).toContain("<section className={styles.field}>");
  });

  it("shows its lists as cards that name every value", () => {
    expect(BOX).toMatch(/<table className=.*shared\.stacked/);
    for (const title of [
      "Tanggal",
      "Kegiatan",
      "Alasan klarifikasi",
      "Ditolak oleh",
    ]) {
      expect(BOX).toContain(`data-title="${title}"`);
    }
  });
});
