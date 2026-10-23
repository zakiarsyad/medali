import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const FOLDER = "src/features/dorm";

// Starts with a break, so the first rule is found like every other.
const STYLES = `\n${readFileSync(`${FOLDER}/dashboard.module.css`, "utf8")}`;

function read(name: string): string {
  return readFileSync(`${FOLDER}/${name}`, "utf8");
}

/** What a rule of the style file holds, without the breaks between its lines. */
function ruleOf(selector: string): string {
  const start = STYLES.indexOf(`\n${selector} {`);
  if (start === -1) return "";
  const body = STYLES.slice(start, STYLES.indexOf("}", start));
  return body.replace(/\s+/g, " ");
}

describe("Dashboard asrama on a phone", () => {
  it("stacks the four numbers, on the shared row of numbers that folds", () => {
    const screen = read("dashboard-screen.tsx");

    expect(screen).toContain("<NumberCards>");
    expect(screen.match(/<NumberCard\b/g)).toHaveLength(4);
  });

  it("fits the bars to the width, and puts the parts under each other once they do not fit", () => {
    expect(ruleOf(".bar")).toContain(
      "grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto;",
    );
    expect(ruleOf(".meter")).toContain("width: 100%;");
    expect(ruleOf(".barLabel")).toContain("overflow-wrap: anywhere;");
    expect(ruleOf(".parts")).toContain(
      "minmax(min(100%, var(--column-min-width)), 1fr)",
    );
    expect(ruleOf(".parts > *")).toContain("min-width: 0;");
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

  it("puts the health panels under each other once they do not fit, and turns the table per dorm into a card each, with no box that scrolls sideways", () => {
    const screen = read("dashboard-screen.tsx");
    const panel = read("dashboard-physical-panel.tsx");

    const healthPanels = screen.slice(screen.indexOf("function HealthPanels"));
    expect(healthPanels).toMatch(
      /<div className=\{board\.parts\}>[^<]*<PhysicalHealthPanel[^<]*<MentalHealthPanel[^<]*<\/div>/,
    );
    expect(panel).toMatch(/<table className=.*shared\.stacked/);
    expect(panel).not.toContain("tableWrap");
    expect(panel).toContain(
      '<td className={shared.rowHeading} data-title="Asrama">',
    );
    expect(panel).toContain("data-title={CATEGORY_WORDS[category]}");
  });
});
