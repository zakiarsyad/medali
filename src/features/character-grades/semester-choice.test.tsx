import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { START_PARAMS } from "./grade-address";
import { SemesterChoice } from "./semester-choice";

const CLOSED = [
  { id: "7a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d", title: "Genap 2025/2026" },
  { id: "0b6c3f1e-2d4a-4e5f-9a8b-7c6d5e4f3a2b", title: "Ganjil 2025/2026" },
];

describe("the choice Semester", () => {
  it("offers Berjalan first, then each closed period in the order given", () => {
    const html = renderToStaticMarkup(
      <SemesterChoice closed={CLOSED} params={START_PARAMS} line={null} />,
    );

    expect(html).toContain("Semester");
    const options = [...html.matchAll(/<option[^>]*>([^<]*)</g)].map(
      (match) => match[1],
    );
    expect(options).toEqual([
      "Berjalan",
      "Genap 2025/2026",
      "Ganjil 2025/2026",
    ]);
    expect(html).toContain('<option value="" selected="">Berjalan');
  });

  it("shows the chosen period as chosen, and is sent to the tab's address", () => {
    const chosen = CLOSED[1]?.id ?? null;
    const html = renderToStaticMarkup(
      <SemesterChoice
        closed={CLOSED}
        line={null}
        params={{ ...START_PARAMS, semester: chosen }}
      />,
    );

    expect(html).toContain(`<option value="${chosen}" selected="">`);
    expect(html).toContain('action="/penilaian/karakter"');
    expect(html).toContain('name="semester"');
  });

  it("keeps the search and the filter, and not the page", () => {
    const html = renderToStaticMarkup(
      <SemesterChoice
        closed={CLOSED}
        line={null}
        params={{
          ...START_PARAMS,
          query: "ayu",
          filter: "incomplete",
          page: 3,
        }}
      />,
    );

    expect(html).toContain('name="cari" value="ayu"');
    expect(html).toContain('name="saring" value="belum-lengkap"');
    expect(html).not.toContain('name="hal"');
  });

  it("shows the line of the closed period chosen, and none for Berjalan", () => {
    const line =
      "Nilai semester Ganjil 2025/2026, ditetapkan 3 Feb 2026. Tidak berubah lagi.";
    const chosen = renderToStaticMarkup(
      <SemesterChoice closed={CLOSED} params={START_PARAMS} line={line} />,
    );
    const running = renderToStaticMarkup(
      <SemesterChoice closed={CLOSED} params={START_PARAMS} line={null} />,
    );

    expect(chosen).toContain(line);
    expect(running).not.toContain("Nilai semester");
  });
});
