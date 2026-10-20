import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { GradeNumberCards } from "./grade-number-cards";

const NUMBERS = {
  students: 120,
  meanFinal: 67.75,
  complete: 100,
  passing: 82,
  adjusted: 14,
  incomplete: 20,
};

describe("the four numbers above Skema bobot", () => {
  it("shows Rerata nilai akhir, Memenuhi minimal with how many do not, Mendapat penyesuaian SIKU and Belum lengkap", () => {
    const page = renderToStaticMarkup(
      <GradeNumberCards numbers={NUMBERS} passLetter="B" sikuBase={65} />,
    );

    for (const words of [
      "Rerata nilai akhir",
      "67,8",
      "100 dari 120 mahasiswa aktif",
      "Memenuhi minimal B",
      "82%",
      "18 belum memenuhi",
      "Mendapat penyesuaian SIKU",
      ">14<",
      "sisanya SIKU dasar 65",
      "Belum lengkap",
      ">20<",
    ]) {
      expect(page).toContain(words);
    }
  });

  it("shows a dash for the mean and the share while no grade is worked out", () => {
    const none = { ...NUMBERS, meanFinal: null, complete: 0, passing: 0 };

    const page = renderToStaticMarkup(
      <GradeNumberCards numbers={none} passLetter="B" sikuBase={65} />,
    );

    expect(page.match(/>-</g)).toHaveLength(2);
  });
});
