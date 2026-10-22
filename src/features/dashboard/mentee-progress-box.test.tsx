import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { MentoringProgress } from "./mentee-progress";
import { MenteeProgressBox } from "./mentee-progress-box";

const LINKS = { meetings: "/pengasuhan/hadir", scores: "/pengasuhan/nilai" };

const LEFT: MentoringProgress = {
  period: { startYear: 2026, term: "odd" },
  filled: 2,
  meetings: 4,
  scored: 12,
  students: 12,
};

describe("the progress box of Dashboard anak asuh", () => {
  it("says what is filled in, with the links to fill in the rest", () => {
    const html = renderToStaticMarkup(
      <MenteeProgressBox progress={LEFT} links={LINKS} />,
    );

    expect(html).toContain(
      "Semester Ganjil 2026/2027: 2 dari 4 pertemuan pengasuhan",
    );
    expect(html).toContain('href="/pengasuhan/hadir">Isi daftar hadir</a>');
    expect(html).toContain('href="/pengasuhan/nilai">Isi nilai pengasuhan</a>');
  });

  it("is marked as a warning until both are complete", () => {
    const left = renderToStaticMarkup(
      <MenteeProgressBox progress={LEFT} links={LINKS} />,
    );
    const complete = renderToStaticMarkup(
      <MenteeProgressBox progress={{ ...LEFT, filled: 4 }} links={LINKS} />,
    );

    expect(left).toContain("progressWarn");
    expect(complete).not.toContain("progressWarn");
  });

  it("leaves out a link to a tab the account may not open", () => {
    const html = renderToStaticMarkup(
      <MenteeProgressBox
        progress={LEFT}
        links={{ meetings: null, scores: LINKS.scores }}
      />,
    );

    expect(html).not.toContain("Isi daftar hadir");
    expect(html).toContain("Isi nilai pengasuhan");
  });

  it("says why nothing can be filled in while no period runs", () => {
    const html = renderToStaticMarkup(
      <MenteeProgressBox progress={null} links={LINKS} />,
    );

    expect(html).toContain("Belum ada periode akademik yang berjalan");
  });
});
