import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ClarificationFileDialog } from "@/clarifications/clarification-file-dialog";
import { type ClarificationCard, fileAddressOf } from "./clarification-card";
import { ClarificationFiltersView } from "./clarification-filters";
import type { Clarifications } from "./clarifications";
import { ClarificationsScreen } from "./clarifications-screen";
import {
  TEST_CLARIFICATION,
  TEST_NO_CLARIFICATIONS,
} from "./test-clarifications";
import { draw } from "./test-press";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  unstable_rethrow: vi.fn(),
}));
vi.mock("./clarification-actions", () => ({
  decideClarificationAction: vi.fn(),
}));

const TABS = {
  pagePath: "kegiatan",
  tabs: [{ path: "klarifikasi", title: "Klarifikasi kehadiran" }],
  open: "klarifikasi",
};

function shown(more: Partial<Clarifications> = {}): string {
  return renderToStaticMarkup(
    <ClarificationsScreen
      tabs={TABS}
      clarifications={{ ...TEST_NO_CLARIFICATIONS, ...more }}
    />,
  );
}

function listOf(cards: ClarificationCard[], matching = cards.length) {
  return { list: { cards, matching, page: 1 } };
}

const DECIDED: ClarificationCard = {
  ...TEST_CLARIFICATION,
  id: "00000000-0000-4000-8000-0000000000d2",
  status: "rejected",
  decision: {
    result: "Ditolak: Lampiran tidak terbaca.",
    by: "(Penilai Uji, 14 Okt 2026, 09.00)",
  },
};

describe("ClarificationsScreen", () => {
  it("keeps the title of the page and says under it what the tab is for", () => {
    const screen = shown();

    expect(screen).toMatch(/<h1[^>]*>Kegiatan karakter<\/h1>/);
    expect(screen).toContain(
      "Klarifikasi mahasiswa yang tercatat tidak hadir pada kegiatan karakter. Periksa alasan dan lampirannya, lalu terima sebagai hadir, terima sebagai dispensasi, atau tolak.",
    );
    expect(screen).toMatch(/<h2[^>]*>Klarifikasi kehadiran<\/h2>/);
  });

  it("shows the four numbers, each with its line below", () => {
    const screen = shown({
      counts: { submitted: 12, accepted: 3, rejected: 4 },
    });

    for (const [label, amount, note] of [
      ["Menunggu verifikasi", "12", "klarifikasi"],
      ["Diterima", "3", "klarifikasi"],
      ["Ditolak", "4", "klarifikasi"],
      ["Batas pengajuan", "7", "hari setelah masa unggah foto berakhir"],
    ]) {
      expect(screen).toMatch(
        new RegExp(
          `<dt[^>]*>${label}</dt><dd[^>]*>${amount}</dd><dd[^>]*>${note}</dd>`,
        ),
      );
    }
  });

  it("says the flow in one sentence", () => {
    expect(shown()).toContain(
      "Alur: mahasiswa mengajukan, lalu Penilai Mahasiswa memverifikasi dan memvalidasi. Klarifikasi yang diterima mengubah status menjadi hadir atau dispensasi dan langsung memengaruhi nilai kehadiran kegiatan.",
    );
  });

  it("offers the search and the four status choices, Diajukan chosen at the start", () => {
    const screen = shown();

    expect(screen).toContain('placeholder="Cari nama atau NIM"');
    expect(screen).toContain('<option value="semua">Semua status</option>');
    expect(screen).toContain(
      '<option value="diajukan" selected="">Diajukan</option>',
    );
    expect(screen).toContain('<option value="diterima">Diterima</option>');
    expect(screen).toContain('<option value="ditolak">Ditolak</option>');
  });

  it("shows in the fields what the address holds", () => {
    const screen = shown({ filters: { query: "Citra", status: "all" } });

    expect(screen).toContain('value="Citra"');
    expect(screen).toContain(
      '<option value="semua" selected="">Semua status</option>',
    );
  });

  it("says so when no clarification matches, without a line that counts", () => {
    const screen = shown();

    expect(screen).toContain("Tidak ada klarifikasi pada filter ini.");
    expect(screen).not.toContain("dari 0");
  });

  it("counts the cards under them and steps to the next page with the filters kept", () => {
    const screen = shown({
      filters: { query: "uji", status: "all" },
      ...listOf([TEST_CLARIFICATION], 21),
    });

    expect(screen).toContain("1–20 dari 21 klarifikasi");
    expect(screen).toContain(
      'href="/kegiatan/klarifikasi?cari=uji&amp;status=semua&amp;hal=2"',
    );
  });

  it("shows on a card the student, the status, the activity with its time, the reason, the explanation, the file name, when it was sent, and no link to the student's detail", () => {
    const screen = shown(listOf([TEST_CLARIFICATION]));

    for (const words of [
      "Mahasiswa Uji Klarifikasi",
      "8800000011 · Akuntansi uji",
      "Diajukan</span>",
      "<dt>Kegiatan</dt><dd>Latihan dasar kepemimpinan uji",
      "10 Okt 2026, 07:30–11:30",
      "<dt>Alasan</dt><dd>Sakit</dd>",
      "<dt>Penjelasan</dt><dd>Demam sejak malam sebelum kegiatan.</dd>",
      "surat-keterangan.pdf</button>",
      "<dt>Diajukan</dt><dd>13 Okt 2026, 12.00</dd>",
    ]) {
      expect(screen).toContain(words);
    }
    expect(screen).not.toContain("<dt>Keputusan</dt>");
    expect(screen).not.toContain("/mahasiswa");
  });

  it("shows a dash for a card without a file, and the decision of a decided card with who decided and when", () => {
    const screen = shown(listOf([{ ...DECIDED, file: null }]));

    expect(screen).toContain("<dt>Lampiran</dt><dd>-</dd>");
    expect(screen).toMatch(
      /<dt>Keputusan<\/dt><dd>Ditolak: Lampiran tidak terbaca\.<span[^>]*>\(Penilai Uji, 14 Okt 2026, 09\.00\)<\/span><\/dd>/,
    );
  });
});

describe("ClarificationFileDialog", () => {
  const { id } = TEST_CLARIFICATION;

  function box(file: NonNullable<ClarificationCard["file"]>): string {
    return renderToStaticMarkup(
      <ClarificationFileDialog
        file={file}
        addressOf={(isShown) => fileAddressOf(id, isShown)}
        onClose={() => {}}
      />,
    );
  }

  it("shows a PDF in a frame under its name, its kind and size, with Unduh and Tutup and what to do when it does not show", () => {
    const shownBox = box({
      name: "surat-keterangan.pdf",
      isPdf: true,
      facts: "Dokumen PDF · 12 KB",
    });

    expect(shownBox).toMatch(/<h2[^>]*>surat-keterangan\.pdf<\/h2>/);
    expect(shownBox).toContain("Dokumen PDF · 12 KB");
    expect(shownBox).toMatch(
      new RegExp(
        `<a href="/kegiatan/klarifikasi/lampiran/${id}"[^>]*>Unduh</a>`,
      ),
    );
    expect(shownBox).toMatch(/<button[^>]*>Tutup<\/button>/);
    expect(shownBox).toContain(
      `<iframe src="/kegiatan/klarifikasi/lampiran/${id}?lihat=1"`,
    );
    expect(shownBox).toContain(
      "Bila pratinjau tidak tampil, gunakan tombol Unduh.",
    );
  });

  it("shows a picture as a picture, without a frame", () => {
    const shownBox = box({
      name: "foto-surat.jpg",
      isPdf: false,
      facts: "Gambar · 300 KB",
    });

    expect(shownBox).toContain("Gambar · 300 KB");
    expect(shownBox).toContain(
      `<img src="/kegiatan/klarifikasi/lampiran/${id}?lihat=1" alt="foto-surat.jpg"`,
    );
    expect(shownBox).not.toContain("<iframe");
  });
});

describe("ClarificationFiltersView", () => {
  it("tells what is typed and which status is chosen", () => {
    const told: string[] = [];
    const drawn = draw(
      <ClarificationFiltersView
        typed=""
        status="submitted"
        onTyped={(typed) => told.push(typed)}
        onStatus={(status) => told.push(status)}
      />,
    );
    const change = (type: string, value: string) => {
      const field = drawn.find((element) => element.type === type);
      if (!field) throw new Error(`No ${type} is shown.`);
      (field.props.onChange as (event: unknown) => void)({
        target: { value },
      });
    };

    change("input", "Cit");
    change("select", "ditolak");
    change("select", "bukan pilihan");

    expect(told).toEqual(["Cit", "rejected", "submitted"]);
  });
});
