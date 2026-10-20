import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { AGENCY_ONLY, PenaltyForm } from "./penalty-form";

vi.mock("./penalty-actions", () => ({
  penaltyHistoryAction: vi.fn(),
  saveDisciplinePenaltyAction: vi.fn(),
  searchPenaltyStudentsAction: vi.fn(),
}));

const KEY = "00000000-0000-4000-8000-000000000702";
const PERIODS = [
  { startYear: 2026, term: "odd", startsOn: "2026-08-01" } as const,
];

function form(): string {
  return renderToStaticMarkup(
    <PenaltyForm newKey={KEY} today="2026-10-20" periods={PERIODS} />,
  );
}

describe("PenaltyForm", () => {
  it("sends its key, the student picked, Tanggal pelanggaran up to today, Nomor keputusan, Uraian, Kategori and Jenjang, and no field for who recorded it", () => {
    const shown = form();
    expect(shown).toContain(`name="id" value="${KEY}"`);
    expect(shown).toContain('name="studentId"');
    expect(shown).toContain('name="day"');
    expect(shown).toContain('max="2026-10-20"');
    expect(shown).toContain('name="decisionNumber"');
    expect(shown).toContain('name="description"');
    expect(shown).toContain('name="category"');
    expect(shown).toContain('name="level"');
    expect(shown).toContain("Simpan pelanggaran");
    expect(shown).not.toContain("Dicatat oleh");
  });

  it("offers the three Kategori, and the three Jenjang of Ringan with their penalty and kerja sosial", () => {
    const shown = form();
    for (const word of ["Ringan", "Sedang", "Berat"]) {
      expect(shown).toContain(word);
    }
    expect(shown).toContain("Teguran lisan tertulis; kerja sosial 7 hari");
    expect(shown).toContain(
      "Pernyataan tidak puas secara lisan tertulis; kerja sosial 15 hari",
    );
  });

  it("asks the kerja sosial of Ringan pertama: Bentuk, Lokasi with the Instansi asal closed while no student has one, Mulai and when it ends", () => {
    const shown = form();
    expect(shown).toContain('name="socialWorkForms"');
    expect(shown).toContain("Bentuk kerja sosial lainnya");
    expect(shown).toContain('name="socialWorkPlace"');
    expect(shown).toContain(`Unit kerja di instansi asal${AGENCY_ONLY}`);
    expect(shown).toMatch(/<option value="home_agency" disabled="">/);
    expect(shown).toContain('name="socialWorkStart"');
    expect(shown).toContain("Selesai pada 26 Okt 2026.");
    expect(shown).not.toContain('name="confirmed"');
  });

  it("shows Konsekuensi of the chosen Jenjang beside the form, asking for a student to show the history", () => {
    const shown = form();
    expect(shown).toContain("Konsekuensi");
    expect(shown).toContain("Ringan · jenjang pertama");
    expect(shown).toContain(
      "Pilih mahasiswa untuk melihat riwayat pelanggarannya.",
    );
    expect(shown).toContain("7 hari, 20 Okt 2026 sampai 26 Okt 2026");
    expect(shown).toContain("Dibatasi paling tinggi 70.");
  });
});
