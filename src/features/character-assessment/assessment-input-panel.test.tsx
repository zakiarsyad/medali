import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AssessmentInputPanel } from "./assessment-input-panel";

const LEVEL_TEXTS = {
  M: ["M satu", "M dua", "M tiga", "M empat"],
  E: ["E satu", "E dua", "E tiga", "E empat"],
  D: ["D satu", "D dua", "D tiga", "D empat"],
  A: ["A satu", "A dua", "A tiga", "A empat"],
  L: ["L satu", "L dua", "L tiga", "L empat"],
  I: ["I satu", "I dua", "I tiga", "I empat"],
};

describe("Input capaian MEDALI with its two ways in", () => {
  const html = renderToStaticMarkup(
    <AssessmentInputPanel
      newAssessmentId="00000000-0000-4000-8000-000000000611"
      levelTexts={LEVEL_TEXTS}
    />,
  );

  it("offers Satu mahasiswa and Unggah berkas, starting on Satu mahasiswa", () => {
    expect(html).toContain("Input capaian MEDALI");
    expect(html).toContain('aria-pressed="true">Satu mahasiswa</button>');
    expect(html).toContain('aria-pressed="false">Unggah berkas</button>');
    expect(html).toContain("Simpan asesmen");
  });
});

describe("Input capaian MEDALI opened by Input asesmen", () => {
  const html = renderToStaticMarkup(
    <AssessmentInputPanel
      newAssessmentId="00000000-0000-4000-8000-000000000612"
      levelTexts={LEVEL_TEXTS}
      startPick={{
        id: "00000000-0000-4000-8000-000000000613",
        name: "Ani Contoh Dipilih",
        nim: "9989330001",
        program: "D3 Akuntansi",
        latest: { M: 80, E: 64, D: 85, A: 72, L: 82, I: 86 },
      }}
    />,
  );

  it("opens with the student picked and the sliders at their latest scores", () => {
    expect(html).toContain("Ani Contoh Dipilih");
    expect(html).toContain("Ganti mahasiswa");
    expect(html).toContain(
      'name="studentId" value="00000000-0000-4000-8000-000000000613"',
    );
    expect(html).toContain('name="score_E" value="64"');
    expect(html).not.toContain(
      "Pilih mahasiswa untuk melihat pratinjau medali.",
    );
  });
});
