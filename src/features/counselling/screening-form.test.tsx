import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { ConsentView } from "./consent-view";
import { ScreeningEvaluation } from "./screening-evaluation";
import { ConsentPart, ScreeningForm } from "./screening-form";
import type { SentScores } from "./screening-input";
import {
  ADVICE_WORDS,
  CONSENT_FIRST,
  CRISIS_ADVICE,
  scoreOutOfRange,
} from "./screening-words";

// 10:00 on campus on 16 October 2026.
const MOMENT = new Date("2026-10-16T03:00:00Z");

const DASS: SentScores = {
  instrument: "dass21",
  depression: "6",
  anxiety: "3",
  stress: "8",
  srqYes: "0",
  selfHarm: false,
};

function consentOf(status: ConsentView["status"]): ConsentView {
  return {
    status,
    way: status === "approved" ? "paper" : null,
    changedAt: MOMENT,
    counsellorName: null,
    version: MOMENT.toISOString(),
  };
}

describe("Asesmen kesehatan mental", () => {
  it("asks for the student, Tanggal asesmen, Instrumen with the three DASS-21 sums, the tick and the note", () => {
    const page = renderToStaticMarkup(
      <ScreeningForm today="2026-10-16" newKey="kunci" />,
    );
    for (const words of [
      "Mahasiswa",
      'aria-label="Cari mahasiswa"',
      "Tanggal asesmen",
      'max="2026-10-16"',
      "Instrumen",
      "DASS-21",
      "SRQ-20",
      "Depresi (jumlah 7 butir, 0–21)",
      "Kecemasan (jumlah 7 butir, 0–21)",
      "Stres (jumlah 7 butir, 0–21)",
      "Ada indikasi pikiran atau tindakan menyakiti diri",
      "Catatan konselor (rahasia)",
      "Simpan asesmen",
    ]) {
      expect(page).toContain(words);
    }
    expect(page).toContain(ADVICE_WORDS.normal);
  });

  it("says consent is needed first for a student whose consent is not Disetujui", () => {
    for (const status of ["waiting", "declined", "withdrawn"] as const) {
      const part = renderToStaticMarkup(
        <ConsentPart looked={{ ok: true, value: consentOf(status) }} />,
      );
      expect(part).toContain(CONSENT_FIRST);
    }
    const never = renderToStaticMarkup(
      <ConsentPart looked={{ ok: true, value: null }} />,
    );
    expect(never).toContain("Belum diminta");
    expect(never).toContain(CONSENT_FIRST);
    const approved = renderToStaticMarkup(
      <ConsentPart looked={{ ok: true, value: consentOf("approved") }} />,
    );
    expect(approved).toContain("Disetujui");
    expect(approved).not.toContain(CONSENT_FIRST);
  });
});

describe("the level and Rekomendasi as they are typed", () => {
  it("shows the doubled DASS-21 sums, the level and the advice", () => {
    const shown = renderToStaticMarkup(<ScreeningEvaluation sent={DASS} />);
    expect(shown).toContain("Ringan");
    expect(shown).toContain("Depresi 12, Kecemasan 6, Stres 16");
    expect(shown).toContain(ADVICE_WORDS.mild);
  });

  it("shows Sedang and Konseling for an SRQ-20 of 6", () => {
    const shown = renderToStaticMarkup(
      <ScreeningEvaluation
        sent={{ ...DASS, instrument: "srq20", srqYes: "6" }}
      />,
    );
    expect(shown).toContain("Sedang");
    expect(shown).toContain("Konseling");
    expect(shown).not.toContain("Depresi");
  });

  it("shows Sangat berat, Risiko and the crisis advice with the tick", () => {
    const shown = renderToStaticMarkup(
      <ScreeningEvaluation sent={{ ...DASS, selfHarm: true }} />,
    );
    expect(shown).toContain("Sangat berat");
    expect(shown).toContain("Risiko");
    expect(shown).toContain(CRISIS_ADVICE);
  });

  it("says why there is no level yet for a number out of range", () => {
    const shown = renderToStaticMarkup(
      <ScreeningEvaluation sent={{ ...DASS, stress: "25" }} />,
    );
    expect(shown).toContain(scoreOutOfRange("Stres", 21));
  });
});
