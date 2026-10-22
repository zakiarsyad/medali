import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  STARTING_SCHEME,
  STARTING_VERSION,
} from "@/character-grades/scheme-ids";
import { ClosedScheme, ReadOnlyScheme } from "./read-only-scheme";

const STARTING = {
  scheme: STARTING_SCHEME,
  version: STARTING_VERSION,
  set: null,
};

function fieldsOf(page: string): string[] {
  return page.match(/<(input|select)[^>]*>/g) ?? [];
}

describe("Skema bobot for a role that only reads it", () => {
  it("shows the starting scheme: four weights, the total, the sentence, the letters and the pass letter", () => {
    const page = renderToStaticMarkup(<ReadOnlyScheme inForce={STARTING} />);

    for (const label of [
      "Kehadiran kegiatan",
      "Nilai pengasuhan",
      "Nilai sikap dan perilaku (SIKU)",
      "Nilai Sistem Kredit Prestasi Mahasiswa",
      "Total 100%",
      "Nilai akhir = 25% × kehadiran kegiatan + 25% × pengasuhan",
      "Konversi huruf (batas bawah)",
      "di bawah 50",
      "Batas lulus nilai karakter",
      "Bobot awal belum disesuaikan dengan KEP-220.",
    ]) {
      expect(page).toContain(label);
    }
    expect(page).toContain('aria-label="Batas bawah A"');
    expect(page).toMatch(/<option selected="">B<\/option>/);
  });

  it("switches every field off, offers no Simpan skema, and says who sets the scheme", () => {
    const page = renderToStaticMarkup(<ReadOnlyScheme inForce={STARTING} />);

    const fields = fieldsOf(page);
    expect(fields).toHaveLength(9);
    for (const field of fields) {
      expect(field).toContain("disabled");
    }
    expect(page).not.toContain("Simpan skema");
    expect(page).toContain(
      "Skema bobot ditetapkan oleh Kepala Unit Pembangunan Karakter.",
    );
  });

  it("says when and by whom a set scheme was set", () => {
    const page = renderToStaticMarkup(
      <ReadOnlyScheme
        inForce={{
          scheme: STARTING_SCHEME,
          version: "a",
          set: { at: new Date("2026-10-16T03:00:00Z"), by: "Kepala Uji" },
        }}
      />,
    );

    expect(page).toContain("Ditetapkan 16 Okt 2026 oleh Kepala Uji.");
  });
});

describe("Skema bobot of a closed semester", () => {
  const KEPT = {
    weights: { attendance: 40, mentoring: 20, siku: 20, skpm: 20 },
    lowerLimits: { A: 90, B: 75, C: 60, D: 45 },
    passLetter: "C",
  } as const;
  const LINE =
    "Nilai semester Ganjil 2025/2026, ditetapkan 3 Feb 2026. Tidak berubah lagi.";

  it("shows the weights, the letter limits and the pass letter its closing kept, with the line of the period", () => {
    const page = renderToStaticMarkup(
      <ClosedScheme scheme={KEPT} line={LINE} />,
    );

    for (const words of [
      "Nilai akhir = 40% × kehadiran kegiatan + 20% × pengasuhan",
      "Total 100%",
      'value="90"',
      'value="45"',
      "di bawah 45",
      LINE,
    ]) {
      expect(page).toContain(words);
    }
    expect(page).toContain('<option selected="">C</option>');
  });

  it("switches every field off and offers no Simpan skema, Kepala Unit too", () => {
    const page = renderToStaticMarkup(
      <ClosedScheme scheme={KEPT} line={LINE} />,
    );

    const fields = fieldsOf(page);
    expect(fields).toHaveLength(9);
    for (const field of fields) {
      expect(field).toContain("disabled");
    }
    expect(page).not.toContain("Simpan skema");
  });
});
