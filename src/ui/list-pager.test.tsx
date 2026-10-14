import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ListPager } from "./list-pager";

function pagerOf(page: number, matching: number, stepsOnOnePage = true) {
  return renderToStaticMarkup(
    <ListPager
      page={page}
      matching={matching}
      noun="mahasiswa"
      stepsOnOnePage={stepsOnOnePage}
      addressOf={(to) => `/daftar?hal=${to}`}
    />,
  );
}

describe("ListPager", () => {
  it("says which rows show, and links the pages next to it", () => {
    const pager = pagerOf(2, 1012);

    expect(pager).toContain("26–50 dari 1.012 mahasiswa");
    expect(pager).toContain('href="/daftar?hal=1"');
    expect(pager).toContain('href="/daftar?hal=3"');
  });

  it("shows the steps as words with no link on one page, unless told not to", () => {
    const shown = pagerOf(1, 25);
    const hidden = pagerOf(1, 25, false);

    expect(shown).toContain("Sebelumnya");
    expect(shown).not.toContain("href=");
    expect(hidden).toContain("1–25 dari 25 mahasiswa");
    expect(hidden).not.toContain("Sebelumnya");
    expect(hidden).not.toContain("Berikutnya");
  });

  it("shows the steps when told not to on one page but there are more", () => {
    const pager = pagerOf(1, 26, false);

    expect(pager).toContain('href="/daftar?hal=2"');
    expect(pager).toContain("Sebelumnya");
  });
});
