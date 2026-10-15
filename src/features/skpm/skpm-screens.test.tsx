import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { START_PARAMS } from "./skpm-address";
import { SkpmListTable } from "./skpm-list-table";
import { ReadOnlyNote } from "./skpm-read-only";
import { SkpmScreen } from "./skpm-screen";

vi.mock("next/navigation", () => ({ useRouter: () => ({}) }));

const ANI = "00000000-0000-4000-8000-000000000301";
const BUDI = "00000000-0000-4000-8000-000000000302";

const ROWS = [
  {
    id: ANI,
    name: "Ani Contoh",
    nim: "9900230001",
    program: "D3 Akuntansi",
    totals: { activities: 3, total: 30, score: 60 },
  },
  {
    id: BUDI,
    name: "Budi Contoh",
    nim: "9900240002",
    program: "D3 Pajak",
    totals: null,
  },
];

describe("Nilai SKPM per mahasiswa", () => {
  const html = renderToStaticMarkup(
    <SkpmListTable rows={ROWS} params={START_PARAMS} />,
  );

  it("shows Kegiatan, Total poin and Nilai SKPM with Rincian for a student with data", () => {
    expect(html).toContain('<td data-title="Kegiatan">3</td>');
    expect(html).toContain('<td data-title="Total poin">30</td>');
    expect(html).toContain("60,0");
    expect(html).toContain(`href="/penilaian/skpm?rincian=${ANI}"`);
  });

  it("shows Belum ada data, and no Rincian, for a student without", () => {
    expect(html).toContain("Belum ada data");
    expect(html).not.toContain(`rincian=${BUDI}`);
  });

  it("becomes cards on a phone", () => {
    expect(html).toMatch(/<table class="[^"]*stacked/);
  });
});

describe("the top of Data SKPM", () => {
  const html = renderToStaticMarkup(
    <SkpmScreen
      tabs={{ pagePath: "penilaian", tabs: [], open: "skpm" }}
      params={START_PARAMS}
      pointsForHundred={50}
      numbers={{
        students: 40,
        withData: 2,
        meanPoints: 23.5,
        meanScore: 47,
        uploads: 3,
      }}
      list={{ rows: ROWS, matching: 2, page: 1 }}
      manage={<ReadOnlyNote pointsForHundred={50} />}
    />,
  );

  it("shows the four numbers", () => {
    expect(html).toContain("Mahasiswa dengan data SKPM");
    expect(html).toContain("dari 40 mahasiswa aktif");
    expect(html).toContain("Rerata poin");
    expect(html).toContain("23,5");
    expect(html).toContain("Rerata nilai SKPM");
    expect(html).toContain("47,0");
    expect(html).toContain("50 poin = nilai 100");
    expect(html).toContain("3 unggahan");
  });

  it("tells a role that only reads who uploads and how many points equal 100", () => {
    expect(html).toContain(
      "Data SKPM diunggah oleh Kepala Unit Pembangunan Karakter dan Penilai Mahasiswa.",
    );
    expect(html).toContain("50 poin setara nilai 100.");
  });
});
