import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { FitnessInputPanel } from "./fitness-input-panel";
import { FitnessUpload } from "./fitness-upload";

describe("Unggah berkas of Input hasil tes kebugaran", () => {
  const html = renderToStaticMarkup(<FitnessUpload today="2026-10-16" />);

  it("names the columns with the prototype's note and the limits", () => {
    expect(html).toContain(
      "Satu baris per mahasiswa. Kolom: <b>nim</b>, <b>skor</b>.",
    );
    expect(html).toContain("Skor 0–100.");
    expect(html).toContain("Satu berkas paling banyak 1.000 baris dan 1 MB.");
  });

  it("asks for Tanggal tes, today at first and never after it", () => {
    expect(html).toContain("Tanggal tes");
    expect(html).toMatch(
      /<input type="date"[^>]* max="2026-10-16"[^>]* value="2026-10-16"/,
    );
  });

  it("offers the template as a CSV file to download", () => {
    expect(html).toContain('download="templat-tes-kebugaran.csv"');
    expect(html).toContain(">Unduh templat CSV</a>");
  });

  it("offers a place to pick or drop a CSV file", () => {
    expect(html).toContain('accept=".csv,text/csv"');
    expect(html).toContain("Pilih berkas CSV");
    expect(html).toContain("atau seret berkas ke sini");
  });
});

describe("the ways into Input hasil tes kebugaran", () => {
  const html = renderToStaticMarkup(
    <FitnessInputPanel today="2026-10-16" form={<p>Formulir kelompok</p>} />,
  );

  it("offers Formulir kolektif and Unggah berkas, and starts on the form", () => {
    expect(html).toContain(">Formulir kolektif</button>");
    expect(html).toContain(">Unggah berkas</button>");
    expect(html).toContain('aria-pressed="true">Formulir kolektif');
    expect(html).toContain("<p>Formulir kelompok</p>");
    expect(html).not.toContain("Unduh templat CSV");
  });
});
