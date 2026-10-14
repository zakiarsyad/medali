import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import shared from "@/ui/data-screen.module.css";
import type { SikuFilePreview } from "./siku-file-preview";
import { SikuFilePreviewView } from "./siku-file-preview-view";

const PREVIEW: SikuFilePreview = {
  ready: 7,
  firstRows: [
    {
      row: 2,
      nim: "4121230001",
      name: "Ani Uji",
      kind: "loss",
      reason: "unannounced_absence",
      points: 3,
      keterangan: "Tidak hadir apel",
    },
  ],
  skipped: 31,
  firstSkipped: [
    { row: 9, nim: "4121230009", reason: "Mahasiswa tidak aktif." },
  ],
};

function render(preview: SikuFilePreview): string {
  return renderToStaticMarkup(
    <SikuFilePreviewView name="siku.csv" preview={preview}>
      <button type="button">Simpan</button>
    </SikuFilePreviewView>,
  );
}

describe("the preview of a SIKU file", () => {
  const html = render(PREVIEW);

  it("says how many rows are ready and how many are skipped", () => {
    expect(html).toContain(
      "<b>siku.csv</b>: 7 baris siap disimpan, 31 baris dilewati.",
    );
  });

  it("shows the ready rows in a table that scrolls inside its own box", () => {
    expect(html).toContain(`<div class="${shared.tableWrap}"><table`);
    expect(html).toContain(
      "<th>nim</th><th>nama</th><th>jenis</th><th>alasan</th><th>poin</th><th>keterangan</th>",
    );
    expect(html).toContain("Pengurangan");
    expect(html).toContain("−3");
    expect(html).toContain("dan 6 baris lainnya.");
  });

  it("lists each skipped row with its number, its NIM and why, under Lihat baris yang dilewati", () => {
    expect(html).toContain("<summary>Lihat baris yang dilewati</summary>");
    expect(html).toContain(
      "<li>Baris 9 (4121230009): Mahasiswa tidak aktif.</li>",
    );
    expect(html).toContain("Menampilkan 30 dari 31 baris yang dilewati.");
  });

  it("shows no button when no row can be saved", () => {
    const none = render({ ...PREVIEW, ready: 0, firstRows: [] });

    expect(none).not.toContain("Simpan");
    expect(none).not.toContain("<table");
  });
});
