import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { AcademicPeriod } from "@/academic-periods/academic-period";
import { PeriodList } from "./period-list";

const TODAY = "2026-10-22";

function period(
  id: string,
  startYear: number,
  term: AcademicPeriod["term"],
  startsOn: string,
  endsOn: string,
): AcademicPeriod {
  return { id, startYear, term, startsOn, endsOn };
}

const UPCOMING = period("p4", 2026, "even", "2027-02-01", "2027-07-31");
const RUNNING = period("p3", 2026, "odd", "2026-08-01", "2027-01-31");
const ENDED = period("p2", 2025, "even", "2026-02-01", "2026-07-31");
const CLOSED = period("p1", 2025, "odd", "2025-08-01", "2026-01-31");

const PERIODS = [UPCOMING, RUNNING, ENDED, CLOSED];

const CLOSINGS = new Map([
  [CLOSED.id, { closedAt: new Date("2026-02-03T02:00:00Z"), kept: 118 }],
]);

function listHtml(mayClose = true): string {
  return renderToStaticMarkup(
    createElement(PeriodList, {
      periods: PERIODS,
      today: TODAY,
      closed: CLOSINGS,
      step: null,
      mayClose,
    }),
  );
}

/** The part of the list that belongs to one period. */
function itemOf(html: string, title: string): string {
  const items = html.split("<li").slice(1);
  const item = items.find((each) => each.includes(title));
  if (!item) throw new Error(`${title} is not in the list.`);
  return item;
}

describe("the list of periods", () => {
  it("shows the state of each period", () => {
    const html = listHtml();

    expect(itemOf(html, "Genap 2026/2027")).toContain("Belum dimulai");
    expect(itemOf(html, "Ganjil 2026/2027")).toContain("Berjalan");
    expect(itemOf(html, "Genap 2025/2026")).toContain("Selesai, belum ditutup");
    expect(itemOf(html, "Ganjil 2025/2026")).toContain(
      "Ditutup 3 Feb 2026 · 118 nilai ditetapkan",
    );
  });

  it('offers "Tutup semester" only on a period that has ended and is not closed', () => {
    const html = listHtml();
    const button = "Tutup semester</a>";

    expect(itemOf(html, "Genap 2025/2026")).toContain(
      `href="/pengaturan/periode?tutup=${ENDED.id}"`,
    );
    expect(itemOf(html, "Genap 2025/2026")).toContain(button);
    for (const title of [
      "Genap 2026/2027",
      "Ganjil 2026/2027",
      "Ganjil 2025/2026",
    ]) {
      expect(itemOf(html, title)).not.toContain(button);
    }
  });

  it('hides "Tutup semester" from an account without the right', () => {
    expect(listHtml(false)).not.toContain("Tutup semester");
  });
});
