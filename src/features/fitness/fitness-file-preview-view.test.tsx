import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import shared from "@/ui/data-screen.module.css";
import type { FitnessFilePreview } from "./fitness-file-preview";
import { FitnessFilePreviewView } from "./fitness-file-preview-view";

const PREVIEW: FitnessFilePreview = {
  ready: 7,
  firstRows: [
    {
      row: 2,
      nim: "4121230001",
      name: "Ani Uji",
      score: 62,
      category: "attention",
    },
  ],
  skipped: 31,
  firstSkipped: [
    { row: 9, nim: "4121230009", reason: "Mahasiswa tidak aktif." },
  ],
  duplicates: 2,
};

function render(preview: FitnessFilePreview): string {
  return renderToStaticMarkup(
    <FitnessFilePreviewView name="kebugaran.csv" preview={preview}>
      <button type="button">Simpan</button>
    </FitnessFilePreviewView>,
  );
}

describe("the preview of a fitness file", () => {
  const html = render(PREVIEW);

  it("says how many rows are ready, skipped, and how many NIM are ganda", () => {
    expect(html).toContain(
      "<b>kebugaran.csv</b>: 7 baris siap disimpan, 31 baris dilewati, 2 NIM ganda (dipakai baris terakhir).",
    );
  });

  it("says nothing of NIM ganda when there is none", () => {
    expect(render({ ...PREVIEW, duplicates: 0 })).not.toContain("NIM ganda");
  });

  it("shows each ready row with its score and category, in a table that scrolls inside its own box", () => {
    expect(html).toContain(`<div class="${shared.tableWrap}"><table`);
    expect(html).toContain(
      "<th>nim</th><th>nama</th><th>skor</th><th>Kategori</th>",
    );
    expect(html).toContain("<td>4121230001</td>");
    expect(html).toContain("<td>62</td>");
    expect(html).toContain(">Perlu perhatian</span>");
    expect(html).toContain("dan 6 baris lainnya.");
  });

  it("lists each skipped row with its number, its NIM and why, under Lihat baris yang dilewati", () => {
    expect(html).toContain("<summary>Lihat baris yang dilewati</summary>");
    expect(html).toContain(
      "<li>Baris 9 (4121230009): Mahasiswa tidak aktif.</li>",
    );
  });

  it("shows no button and no table when no row can be saved", () => {
    const none = render({ ...PREVIEW, ready: 0, firstRows: [] });

    expect(none).not.toContain("Simpan");
    expect(none).not.toContain("<table");
  });
});
