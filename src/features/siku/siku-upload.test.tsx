import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { sikuTemplateCsv } from "./siku-file-columns";
import { SikuUpload } from "./siku-upload";

describe("Unggah berkas of Input nilai SIKU", () => {
  const html = renderToStaticMarkup(<SikuUpload />);

  it("names the columns, keterangan as optional, with the prototype's note and the limits", () => {
    expect(html).toContain(
      "Kolom: <b>nim</b>, <b>jenis</b>, <b>alasan</b>, <b>poin</b>, <b>keterangan</b> (opsional).",
    );
    expect(html).toContain(
      "Jenis: tambah atau kurang. Alasan boleh nomor urut (penambahan 1–5, pengurangan 1–4) atau teks alasannya. Poin 1–30.",
    );
    expect(html).toContain("Satu berkas paling banyak 1.000 baris dan 1 MB.");
  });

  it("offers the template as a CSV file to download", () => {
    expect(html).toContain('download="templat-penyesuaian-siku.csv"');
    expect(html).toContain(">Unduh templat CSV</a>");
  });

  it("offers a place to pick or drop a CSV file", () => {
    expect(html).toContain('accept=".csv,text/csv"');
    expect(html).toContain("Pilih berkas CSV");
    expect(html).toContain("atau seret berkas ke sini");
  });
});

describe("sikuTemplateCsv", () => {
  it("holds the column titles and one made-up gain", () => {
    expect(sikuTemplateCsv().split("\n")).toEqual([
      "nim,jenis,alasan,poin,keterangan",
      "4121239999,tambah,5,2,Petugas kegiatan ibadah rutin",
      "",
    ]);
  });
});
