import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { START_PARAMS } from "./assessment-address";
import type { AssessmentListRow } from "./assessment-board";
import type { AssessmentHistory } from "./assessment-history";
import { AssessmentHistoryDialog } from "./assessment-history-dialog";
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
      fileName: "asesmen-oktober.csv",
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
  const html = renderToStaticMarkup(
    <AssessmentListTable rows={ROWS} params={START_PARAMS} />,
  );

  it("shows Tanggal, Sumber with the uploaded file and who entered it, the six scores, Rerata and Predikat", () => {
    expect(html).toContain('<td data-title="Tanggal">12 Okt 2026</td>');
    expect(html).toContain(
      "Instrumen asesmen MEDALI · Unggah asesmen-oktober.csv",
    );
    expect(html).toContain("Penilai Contoh");
    expect(html).toContain('<td data-title="Mandiri">80</td>');
    expect(html).toContain('<td data-title="Integritas">86</td>');
    expect(html).toContain("80,3");
    expect(html).toContain("Perak");
  });

  it("shows Belum diasesmen for a student without one, whose row opens nothing", () => {
    expect(html).toContain("Belum diasesmen");
    expect(html).not.toContain(`riwayat=${BUDI}`);
  });

  it("opens the earlier assessments of a student with one", () => {
    expect(html).toContain(`href="/penilaian/asesmen?riwayat=${ANI}"`);
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

describe("the earlier assessments of a student", () => {
  const history: AssessmentHistory = {
    id: ANI,
    name: "Ani Contoh",
    nim: "9986050001",
    program: "D3 Akuntansi",
    entries: [
      {
        id: "00000000-0000-4000-8000-000000000411",
        enteredAt: new Date("2026-10-12T03:00:00Z"),
        period: { startYear: 2026, term: "odd" },
        source: "medali_instrument",
        fileName: "asesmen-oktober.csv",
        enteredBy: "Penilai Contoh",
        scores: { M: 80, E: 78, D: 84, A: 72, L: 82, I: 86 },
        note: "Catatan rahasia penilai.",
      },
      {
        id: "00000000-0000-4000-8000-000000000412",
        enteredAt: new Date("2026-03-02T03:00:00Z"),
        period: { startYear: 2025, term: "even" },
        source: "self_assessment",
        fileName: null,
        enteredBy: "Kepala Contoh",
        scores: { M: 60, E: 62, D: 58, A: 64, L: 60, I: 62 },
        note: "",
      },
    ],
  };

  it("lists every one, newest first, with Tanggal, period, Sumber, who, the six scores, Rerata and Predikat", () => {
    const html = renderToStaticMarkup(
      <AssessmentHistoryDialog
        history={history}
        params={START_PARAMS}
        withNotes
      />,
    );

    expect(html.indexOf("12 Okt 2026")).toBeLessThan(
      html.indexOf("2 Mar 2026"),
    );
    expect(html).toContain("Ganjil 2026/2027");
    expect(html).toContain("Genap 2025/2026");
    expect(html).toContain("Kepala Contoh");
    expect(html).toContain(
      "Instrumen asesmen MEDALI · Unggah asesmen-oktober.csv",
    );
    expect(html).toContain(">Penilaian diri</span>");
    expect(html).toContain("Perlu pembinaan");
    expect(html).toContain("Catatan rahasia penilai.");
    expect(html).toMatch(/<table class="[^"]*stacked/);
  });

  it("has no Catatan penilai for a role that only reads", () => {
    const html = renderToStaticMarkup(
      <AssessmentHistoryDialog
        history={history}
        params={START_PARAMS}
        withNotes={false}
      />,
    );

    expect(html).not.toContain("Catatan penilai");
    expect(html).not.toContain("Catatan rahasia penilai.");
  });
});
