import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Medal } from "@/character-scores/medal";
import {
  AssessmentForm,
  type LevelTexts,
  MedalPreview,
  ScoreSliders,
} from "./assessment-form";
import type { AssessmentPick } from "./assessment-picks";

const LEVEL_TEXTS: LevelTexts = {
  M: ["M satu", "M dua", "M tiga", "M empat"],
  E: ["E satu", "E dua", "E tiga", "E empat"],
  D: ["D satu", "D dua", "D tiga", "D empat"],
  A: ["A satu", "A dua", "A tiga", "A empat"],
  L: ["L satu", "L dua", "L tiga", "L empat"],
  I: ["I satu", "I dua", "I tiga", "I empat"],
};

const SCORES = { M: 80, E: 64, D: 85, A: 72, L: 82, I: 86 };
const LAST = { M: 75, E: 75, D: 75, A: 75, L: 75, I: 75 };

const PICK: AssessmentPick = {
  id: "00000000-0000-4000-8000-000000000601",
  name: "Ani Contoh",
  nim: "9986060001",
  program: "D3 Akuntansi",
  latest: LAST,
  limit: null,
};

describe("Input capaian MEDALI", () => {
  const html = renderToStaticMarkup(
    <AssessmentForm
      newAssessmentId="00000000-0000-4000-8000-000000000602"
      levelTexts={LEVEL_TEXTS}
      head={<h2>Input capaian MEDALI</h2>}
    />,
  );

  it("asks for a student first, and cannot be saved before one is picked", () => {
    expect(html).toContain("<h2>Input capaian MEDALI</h2>");
    expect(html).toContain('placeholder="Ketik nama atau NIM mahasiswa aktif"');
    expect(html).toMatch(
      /<button type="submit"[^>]*disabled=""[^>]*>Simpan asesmen</,
    );
    expect(html).toContain("Pilih mahasiswa untuk melihat pratinjau medali.");
  });

  it("offers the five sources and a note of 500 characters at most", () => {
    for (const source of [
      "Observasi pengasuh",
      "Penilaian diri",
      "Penilaian teman sejawat",
      "Rapat dewan pengasuh",
      "Instrumen asesmen MEDALI",
    ]) {
      expect(html).toContain(`>${source}</option>`);
    }
    expect(html).toContain('maxLength="500"');
  });

  it("puts the form and the medal side by side, stacking on a phone", () => {
    expect(html).toMatch(/class="[^"]*sideBySide/);
  });
});

describe("the sliders", () => {
  const html = renderToStaticMarkup(
    <ScoreSliders
      scores={SCORES}
      levelTexts={LEVEL_TEXTS}
      onChange={() => undefined}
    />,
  );

  it("run from 40 to 100 by whole numbers, one per value", () => {
    expect(html.match(/type="range"/g)).toHaveLength(6);
    expect(html).toMatch(
      /min="40" max="100" step="1" aria-label="Skor Mandiri" name="score_M"/,
    );
    expect(html).toContain('aria-label="Skor Integritas"');
  });

  it("show beside each score its level and that level's main indicator", () => {
    expect(html).toContain("Level 3 · M tiga");
    expect(html).toContain("Level 1 · E satu");
    expect(html).toContain("Level 4 · D empat");
    expect(html).toContain("Level 2 · A dua");
  });
});

describe("a student under a Ringan or Sedang penalty", () => {
  const limitedPick: AssessmentPick = {
    ...PICK,
    latest: { M: 80, E: 78, D: 84, A: 72, L: 82, I: 86 },
    limit: { category: "light", level: 2 },
  };
  const html = renderToStaticMarkup(
    <AssessmentForm
      newAssessmentId="00000000-0000-4000-8000-000000000603"
      levelTexts={LEVEL_TEXTS}
      head={<h2>Input capaian MEDALI</h2>}
      startPick={limitedPick}
    />,
  );

  it("says why the scores are held at 70", () => {
    expect(html).toContain(
      "Mahasiswa ini menjalani hukuman disiplin ringan jenjang kedua. Skor dibatasi paling tinggi 70.",
    );
  });

  it("lets no slider go above 70, each starting at 70 at most", () => {
    expect(html.match(/max="70"/g)).toHaveLength(6);
    expect(html).not.toContain('max="100"');
    expect(html).toMatch(
      /min="40" max="70" step="1" aria-label="Skor Mandiri" name="score_M" value="70"/,
    );
    expect(html.match(/<output[^>]*>70<\/output>/g)).toHaveLength(6);
  });

  it("starts at 70 for a limited student never assessed", () => {
    const fresh = renderToStaticMarkup(
      <MedalPreview
        picked={{ ...limitedPick, latest: null }}
        scores={SCORES}
      />,
    );
    expect(fresh).toContain("slider dimulai dari 70");
  });

  it("has no note and no limit for a student without one", () => {
    const free = renderToStaticMarkup(
      <AssessmentForm
        newAssessmentId="00000000-0000-4000-8000-000000000604"
        levelTexts={LEVEL_TEXTS}
        head={<h2>Input capaian MEDALI</h2>}
        startPick={PICK}
      />,
    );
    expect(free).not.toContain("hukuman disiplin");
    expect(free.match(/max="100"/g)).toHaveLength(6);
  });
});

describe("Pratinjau medali", () => {
  it("shows Rerata baru with its predikat, and the last assessment as a dashed line", () => {
    const html = renderToStaticMarkup(
      <MedalPreview picked={PICK} scores={SCORES} />,
    );

    expect(html).toContain("Pratinjau medali");
    expect(html).toContain("Rerata baru <b>78,2</b>");
    expect(html).toContain("Perak");
    expect(html).toContain("asesmen sebelumnya 75,0");
    expect(html).toMatch(/class="[^"]*medalLast/);
  });

  it("says the sliders start at 75 for a student never assessed, with no dashed line", () => {
    const html = renderToStaticMarkup(
      <MedalPreview picked={{ ...PICK, latest: null }} scores={SCORES} />,
    );

    expect(html).toContain("slider dimulai dari 75");
    expect(html).not.toMatch(/class="[^"]*medalLast/);
  });
});

describe("the medal", () => {
  it("names each value with its score for a screen reader", () => {
    const html = renderToStaticMarkup(<Medal scores={SCORES} last={null} />);

    expect(html).toContain(
      "<title>Grafik nilai MEDALI: Mandiri 80, Empati 64, Disiplin 85, Adaptif 72, Loyal 82, Integritas 86</title>",
    );
  });
});
