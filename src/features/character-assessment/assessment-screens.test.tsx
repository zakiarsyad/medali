import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { START_PARAMS } from "./assessment-address";
import type { AssessmentListRow } from "./assessment-board";
import { AssessmentListTable } from "./assessment-list-table";
import { AssessmentScreen, ReadOnlyNote } from "./assessment-screen";

vi.mock("next/navigation", () => ({ useRouter: () => ({}) }));

const ANI = "00000000-0000-4000-8000-000000000401";
const BUDI = "00000000-0000-4000-8000-000000000402";

const ROWS: AssessmentListRow[] = [
  {
    id: ANI,
    name: "Ani Contoh",
    nim: "9986050001",
    program: "D3 Akuntansi",
    latest: {
      enteredAt: new Date("2026-10-12T03:00:00Z"),
      source: "medali_instrument",
      enteredBy: "Penilai Contoh",
      scores: { M: 80, E: 78, D: 84, A: 72, L: 82, I: 86 },
    },
  },
  {
    id: BUDI,
    name: "Budi Contoh",
    nim: "9986050002",
    program: "D3 Pajak",
    latest: null,
  },
];

const NUMBERS = {
  students: 4,
  assessed: 1,
  assessedThisPeriod: 1,
  notAssessed: 3,
  meanRerata: 80.3,
};

describe("Hasil asesmen karakter", () => {
  const html = renderToStaticMarkup(<AssessmentListTable rows={ROWS} />);

  it("shows Tanggal, Sumber with who entered it, the six scores, Rerata and Predikat", () => {
    expect(html).toContain('<td data-title="Tanggal">12 Okt 2026</td>');
    expect(html).toContain("Instrumen asesmen MEDALI");
    expect(html).toContain("Penilai Contoh");
    expect(html).toContain('<td data-title="Mandiri">80</td>');
    expect(html).toContain('<td data-title="Integritas">86</td>');
    expect(html).toContain("80,3");
    expect(html).toContain("Perak");
  });

  it("shows Belum diasesmen for a student without one", () => {
    expect(html).toContain("Belum diasesmen");
  });

  it("becomes cards on a phone", () => {
    expect(html).toMatch(/<table class="[^"]*stacked/);
  });
});

describe("the tab", () => {
  function screen(periodName: string | null) {
    return renderToStaticMarkup(
      <AssessmentScreen
        tabs={{ pagePath: "penilaian", tabs: [], open: "asesmen" }}
        params={START_PARAMS}
        numbers={NUMBERS}
        periodName={periodName}
        list={{ rows: ROWS, matching: 2, page: 1 }}
        manage={<ReadOnlyNote />}
      />,
    );
  }

  it("shows the four numbers", () => {
    const html = screen("Ganjil 2026/2027");

    expect(html).toContain("Sudah diasesmen");
    expect(html).toContain("dari 4 mahasiswa aktif (25%)");
    expect(html).toContain("Rerata capaian");
    expect(html).toContain("Diasesmen semester ini");
    expect(html).toContain("asesmen terakhir pada Ganjil 2026/2027");
    expect(html).toContain("Belum diasesmen");
  });

  it("says when no academic period runs", () => {
    expect(screen(null)).toContain("belum ada periode akademik berjalan");
  });

  it("tells a role that only reads who enters the assessments", () => {
    expect(screen(null)).toContain(
      "Hasil asesmen MEDALI diinput oleh Penilai Mahasiswa atau Kepala Unit Pembangunan Karakter.",
    );
  });
});
