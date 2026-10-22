import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ConversionPanel } from "./conversion-panel";
import { START_PARAMS } from "./skpm-address";
import { skpmTemplateCsv } from "./skpm-file-columns";
import { SkpmFilePreviewView } from "./skpm-file-preview-view";
import { SkpmListTable } from "./skpm-list-table";
import { ReadOnlyNote } from "./skpm-read-only";
import { SkpmScreen } from "./skpm-screen";
import { SkpmUpload } from "./skpm-upload";
import { UploadHistoryTable } from "./upload-history-table";

vi.mock("next/navigation", () => ({ useRouter: () => ({}) }));

const ANI = "00000000-0000-4000-8000-000000000301";
const BUDI = "00000000-0000-4000-8000-000000000302";

const ROWS = [
  {
    id: ANI,
    name: "Ani Contoh",
    nim: "9985060001",
    program: "D3 Akuntansi",
    totals: { activities: 3, total: 30, score: 60 },
  },
  {
    id: BUDI,
    name: "Budi Contoh",
    nim: "9985060002",
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

describe("Unggah data SKPM", () => {
  const html = renderToStaticMarkup(<SkpmUpload />);

  it("offers Tambahkan, chosen at first, and Ganti semua data", () => {
    expect(html).toMatch(/aria-pressed="true"[^>]*>Tambahkan</);
    expect(html).toMatch(/aria-pressed="false"[^>]*>Ganti semua data</);
    expect(html).toContain(
      "Baris dalam unggahan ini ditambahkan ke data SKPM yang sudah ada.",
    );
  });

  it("names the columns, says which may be empty, and gives the limits", () => {
    expect(html).toContain(
      "Kolom: <b>nim</b>, <b>kegiatan</b>, <b>kategori</b>, <b>tingkat</b>, <b>peran</b>, <b>tanggal</b>, <b>poin</b>. Kolom tingkat, peran, dan tanggal boleh kosong.",
    );
    expect(html).toContain("Satu berkas paling banyak 1.000 baris dan 1 MB.");
  });

  it("offers the template and a place to pick or drop a CSV file", () => {
    expect(html).toContain('download="templat-skpm.csv"');
    expect(html).toContain(">Unduh templat CSV</a>");
    expect(html).toContain("Pilih berkas CSV");
    expect(html).toContain("atau seret berkas ke sini");
  });

  it("holds a template with the titles and one made-up activity", () => {
    expect(skpmTemplateCsv().split("\n")).toEqual([
      "nim,kegiatan,kategori,tingkat,peran,tanggal,poin",
      "4121239999,Lomba debat anggaran,Lomba atau kompetisi,Nasional,Peserta,2025-10-12,8",
      "",
    ]);
  });
});

describe("a picked SKPM file", () => {
  const preview = {
    ready: 7,
    students: 2,
    firstRows: [
      {
        row: 2,
        studentId: ANI,
        nim: "9985060001",
        name: "Ani Contoh",
        activity: "Seminar",
        category: "Lainnya",
        level: null,
        activityRole: null,
        day: null,
        points: 7.5,
      },
    ],
    skipped: 1,
    firstSkipped: [
      {
        row: 9,
        nim: "9985060099",
        reason: "NIM tidak ada dalam data mahasiswa.",
      },
    ],
  };
  const html = renderToStaticMarkup(
    <SkpmFilePreviewView name="skpm.csv" preview={preview}>
      <button type="button">Simpan 7 baris</button>
    </SkpmFilePreviewView>,
  );

  it("says how many rows are ready and skipped, and shows the first rows as cards on a phone", () => {
    expect(html).toContain(
      "<b>skpm.csv</b>: 7 baris siap disimpan, 1 baris dilewati.",
    );
    expect(html).toContain("dan 6 baris lainnya.");
    expect(html).toContain("7,5");
    expect(html).toMatch(/<table class="[^"]*stacked/);
  });

  it("lists the skipped rows with their number and reason", () => {
    expect(html).toContain("Lihat baris yang dilewati");
    expect(html).toContain(
      "Baris 9 (9985060099): NIM tidak ada dalam data mahasiswa.",
    );
  });
});

describe("Riwayat unggahan", () => {
  const base = {
    enteredAt: new Date("2026-10-14T03:05:00Z"),
    rows: 16,
    students: 10,
    enteredBy: "Penilai Contoh",
  };
  const lines = [
    {
      ...base,
      id: "00000000-0000-4000-8000-000000000401",
      fileName: "skpm-baru.csv",
      mode: "replace",
      state: { kind: "in_force" },
    },
    {
      ...base,
      id: "00000000-0000-4000-8000-000000000402",
      fileName: "skpm-lama.csv",
      mode: "add",
      state: { kind: "replaced" },
    },
    {
      ...base,
      id: "00000000-0000-4000-8000-000000000403",
      fileName: "skpm-salah.csv",
      mode: "add",
      state: {
        kind: "removed",
        at: new Date("2026-10-15T02:00:00Z"),
        by: "Kepala Contoh",
      },
    },
  ] as const;

  it("shows time, file, rows, students, mode and who, with Hapus for those who may", () => {
    const html = renderToStaticMarkup(
      <UploadHistoryTable lines={lines} mayRemove />,
    );

    expect(html).toContain("14 Okt 2026, 10.05");
    expect(html).toContain("skpm-baru.csv");
    expect(html).toContain('<td data-title="Baris">16</td>');
    expect(html).toContain('<td data-title="Mahasiswa">10</td>');
    expect(html).toContain("Ganti semua");
    expect(html).toContain("Penilai Contoh");
    expect(html.split(">Hapus</button>")).toHaveLength(3);
  });

  it("marks a replaced upload tergantikan, and a removed one with who removed it and when", () => {
    const html = renderToStaticMarkup(
      <UploadHistoryTable lines={lines} mayRemove />,
    );

    expect(html.split("tergantikan")).toHaveLength(2);
    expect(html).toContain("Dihapus 15 Okt 2026, 09.00 oleh Kepala Contoh");
  });

  it("offers no Hapus to a role that only reads", () => {
    const html = renderToStaticMarkup(
      <UploadHistoryTable lines={lines} mayRemove={false} />,
    );

    expect(html).not.toContain(">Hapus</button>");
  });
});

describe("Konversi poin ke nilai", () => {
  const html = renderToStaticMarkup(
    <ConversionPanel
      pointsForHundred={40}
      note="Ditetapkan 15 Okt 2026 oleh Penilai Contoh."
    />,
  );

  it("offers Poin untuk nilai 100, 1 to 1000, with Simpan konversi", () => {
    expect(html).toContain("Poin untuk nilai 100");
    expect(html).toMatch(/min="1" max="1000"/);
    expect(html).toContain('value="40"');
    expect(html).toContain("Simpan konversi");
  });

  it("explains the rule and says who set it and when", () => {
    expect(html).toContain(
      "Nilai SKPM = total poin ÷ 40 × 100, paling tinggi 100. Ditetapkan 15 Okt 2026 oleh Penilai Contoh.",
    );
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

describe("names in Nilai SKPM per mahasiswa", () => {
  it("open the student's profile over the tab, apart from Rincian", () => {
    const html = renderToStaticMarkup(
      <SkpmListTable rows={ROWS} params={{ ...START_PARAMS, page: 2 }} />,
    );

    expect(html).toContain(`href="/penilaian/skpm?hal=2&amp;profil=${BUDI}"`);
    expect(html).toContain(`href="/penilaian/skpm?hal=2&amp;rincian=${ANI}"`);
  });
});
