import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { assessmentTemplateCsv } from "./assessment-file-columns";
import { AssessmentUpload } from "./assessment-upload";

describe("Unggah berkas of Input capaian MEDALI", () => {
  const html = renderToStaticMarkup(<AssessmentUpload />);

  it("names the columns with the prototype's note and the limits", () => {
    expect(html).toContain(
      "Satu baris per mahasiswa. Kolom: <b>nim</b>, <b>mandiri</b>, <b>empati</b>, <b>disiplin</b>, <b>adaptif</b>, <b>loyal</b>, <b>integritas</b>.",
    );
    expect(html).toContain("Skor 40–100.");
    expect(html).toContain("Satu berkas paling banyak 1.000 baris dan 1 MB.");
  });

  it("asks once for Sumber asesmen, with the form's five sources", () => {
    expect(html).toContain("Sumber asesmen");
    expect(html.match(/<select/g)).toHaveLength(1);
    for (const source of [
      "Observasi pengasuh",
      "Penilaian diri",
      "Penilaian teman sejawat",
      "Rapat dewan pengasuh",
      "Instrumen asesmen MEDALI",
    ]) {
      expect(html).toContain(`>${source}</option>`);
    }
  });

  it("offers the template as a CSV file to download", () => {
    expect(html).toContain('download="templat-asesmen-medali.csv"');
    expect(html).toContain(">Unduh templat CSV</a>");
  });

  it("offers a place to pick or drop a CSV file", () => {
    expect(html).toContain('accept=".csv,text/csv"');
    expect(html).toContain("Pilih berkas CSV");
    expect(html).toContain("atau seret berkas ke sini");
  });
});

describe("assessmentTemplateCsv", () => {
  it("holds the column titles and one made-up student", () => {
    expect(assessmentTemplateCsv().split("\n")).toEqual([
      "nim,mandiri,empati,disiplin,adaptif,loyal,integritas",
      "4121239999,80,78,84,72,82,86",
      "",
    ]);
  });
});
