// Sample NIMs of this file: 9962000900 to 9962000999. None is added to
// the database.
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ScoreList } from "./score-list";
import { ScoreNumbers } from "./score-numbers";
import type { ScoreRow } from "./score-rows";
import { ScoreRubric } from "./score-rubric";
import { scoresOverview } from "./scores-overview";

const SCORED: ScoreRow = {
  id: "0b4f6c1e-6f0e-4f55-9d0a-0d3c1e2f7601",
  name: "Ani Uji Daftar",
  nim: "9962000901",
  detailAddress: "/pengasuhan/nilai?kelompok=g&profil=a",
  attendance: "3/4",
  score: 88,
  scoredOn: "8 Okt 2026",
};
const UNSCORED: ScoreRow = {
  id: "0b4f6c1e-6f0e-4f55-9d0a-0d3c1e2f7602",
  name: "Budi Uji Daftar",
  nim: "9962000902",
  detailAddress: null,
  attendance: "-",
  score: null,
  scoredOn: null,
};

/** The rows of the list as text, one for each member. */
function rowsOf(rows: ScoreRow[]): string[] {
  const shown = renderToStaticMarkup(<ScoreList rows={rows} />);
  return shown.split("<tr").slice(2);
}

describe("ScoreList", () => {
  it("has the columns Anak asuh, Kehadiran pengasuhan, Nilai pengasuhan and Keterangan", () => {
    const shown = renderToStaticMarkup(<ScoreList rows={[SCORED]} />);

    for (const title of [
      "Anak asuh",
      "Kehadiran pengasuhan",
      "Nilai pengasuhan",
      "Keterangan",
    ]) {
      expect(shown).toContain(`<th>${title}</th>`);
    }
  });

  it("shows a final score with its decimal, and what the rubric says of it", () => {
    const [row] = rowsOf([{ ...SCORED, score: 83.3 }]);

    expect(row).toContain("<b>83,3</b>");
    expect(row).toContain("Aktif dan konsisten mengikuti pengasuhan");
  });

  it("shows a member with NIM, attendance, the saved score, what the rubric says of it and the day it was saved", () => {
    const [row] = rowsOf([SCORED, UNSCORED]);

    expect(row).toContain("Ani Uji Daftar");
    expect(row).toContain("9962000901");
    expect(row).toContain("3/4");
    expect(row).toContain("<b>88</b>");
    expect(row).toContain(
      "Sangat aktif, menjadi teladan dan menggerakkan kelompok",
    );
    expect(row).toContain("Diinput 8 Okt 2026");
    expect(row).not.toContain("Belum dinilai");
  });

  it("shows a member without a score as Belum dinilai, with a dash and no sentence of the rubric", () => {
    const [, row] = rowsOf([SCORED, UNSCORED]);

    expect(row).toContain("Budi Uji Daftar");
    expect(row).toContain("<b>-</b>");
    expect(row).toContain("Belum dinilai");
    expect(row).not.toContain("aktif");
    expect(row).not.toContain("Diinput");
  });

  it("has no box and no button: nothing can be typed or sent", () => {
    const shown = renderToStaticMarkup(<ScoreList rows={[SCORED, UNSCORED]} />);

    expect(shown).not.toContain("<input");
    expect(shown).not.toContain("<button");
    expect(shown).not.toContain("<form");
  });

  it("makes the name a link to the detail only where the detail may be opened", () => {
    const [scored, unscored] = rowsOf([SCORED, UNSCORED]);

    expect(scored).toContain(
      'href="/pengasuhan/nilai?kelompok=g&amp;profil=a"',
    );
    expect(unscored).not.toContain("<a ");
  });
});

describe("ScoreNumbers", () => {
  function numbersOf(scores: (number | null)[], held: number): string {
    return renderToStaticMarkup(
      <ScoreNumbers overview={scoresOverview(scores)} held={held} />,
    );
  }

  it("shows how many members are scored and how many are left", () => {
    const shown = numbersOf([80, 90, null], 2);

    expect(shown).toContain("Sudah dinilai pengasuh");
    expect(shown).toContain("2 / 3");
    expect(shown).toContain("1 belum diinput");
  });

  it("shows the average of the saved scores and the meetings held", () => {
    const shown = numbersOf([80, 90, null], 2);

    expect(shown).toContain("Rerata nilai pengasuhan");
    expect(shown).toContain("85,0");
    expect(shown).toContain("Pertemuan terlaksana");
    expect(shown).toContain("2 / 4");
  });

  it("shows a dash for the average while nobody is scored, and lengkap when all are", () => {
    const unscored = numbersOf([null, null], 0);
    const done = numbersOf([70, 75], 4);

    expect(unscored).toMatch(/>-</);
    expect(unscored).toContain("2 belum diinput");
    expect(done).not.toMatch(/>-</);
    expect(done).toContain("lengkap");
  });
});

describe("ScoreRubric", () => {
  it("shows the four bands, each with its sentence", () => {
    const shown = renderToStaticMarkup(<ScoreRubric />);

    expect(shown).toContain("Panduan penilaian");
    for (const words of [
      "85–100",
      "Sangat aktif, menjadi teladan dan menggerakkan kelompok",
      "75–84",
      "Aktif dan konsisten mengikuti pengasuhan",
      "65–74",
      "Cukup aktif, perlu dorongan",
      "0–64",
      "Kurang aktif, perlu pendampingan khusus",
    ]) {
      expect(shown).toContain(words);
    }
  });
});
