import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const FOLDER = "src/features/dorm";

function read(name: string): string {
  return readFileSync(`${FOLDER}/${name}`, "utf8");
}

describe("Dashboard asrama on a phone", () => {
  it("stacks the four numbers, on the shared row of numbers that folds", () => {
    const screen = read("dashboard-screen.tsx");

    expect(screen).toContain("<NumberCards>");
    expect(screen.match(/<NumberCard\b/g)).toHaveLength(4);
  });

  it("turns Kehadiran kegiatan into a card each that names every value", () => {
    const table = read("dashboard-activities.tsx");

    expect(table).toMatch(/<table className=.*shared\.stacked/);
    expect(table).toContain(
      '<td className={shared.rowHeading} data-title="Kegiatan">',
    );
    for (const title of [
      "Waktu",
      "Penanggung jawab",
      "Peserta",
      "Hadir",
      "Izin",
      "Tidak hadir",
      "Kehadiran",
    ]) {
      expect(table).toContain(`<td data-title="${title}">`);
    }
  });
});
