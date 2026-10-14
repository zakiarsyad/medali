import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ActivityForm, type FormTarget } from "./activity-form";
import { TEST_ONE_OFF, TEST_ROW } from "./test-activities";

vi.mock("./activity-actions", () => ({ saveActivityAction: vi.fn() }));

const NEW_ID = "00000000-0000-4000-8000-00000000f001";

function form(target: FormTarget): string {
  return renderToStaticMarkup(
    <ActivityForm
      target={target}
      newActivityId={NEW_ID}
      day="2026-10-14"
      today="2026-10-14"
      onSaved={vi.fn()}
      onCancel={vi.fn()}
      removal={null}
    />,
  );
}

const LABELS = [
  "Nama kegiatan",
  "Kategori",
  "Lokasi",
  "Mulai",
  "Selesai",
  "Penanggung jawab",
  "Nama penanggung jawab",
  "Peserta",
  "Wajib hadir",
  "Rincian kegiatan",
];

describe("the form of a new repeating activity", () => {
  const shown = form({ isRoutine: true, activity: null });

  it("has every field of the spec, under the key the page made", () => {
    for (const label of [
      ...LABELS,
      "Pola pengulangan",
      "Berlaku mulai",
      "Berlaku sampai (opsional)",
      "Hari tanpa kegiatan rutin ini",
    ]) {
      expect(shown).toContain(label);
    }
    expect(shown).toContain(`name="id" value="${NEW_ID}"`);
    expect(shown).not.toContain('name="version"');
    expect(shown).toContain("Kegiatan rutin baru</h2>");
    expect(shown).toContain("Simpan kegiatan</button>");
  });

  it("offers the three patterns, the eight Kategori, the three penanggung jawab and every Peserta", () => {
    for (const choice of [
      ">Harian<",
      ">Mingguan<",
      ">Bulanan<",
      ">Kesenian dan budaya<",
      ">Unit Pembangunan Karakter<",
      ">Pelatih<",
      ">Badan Asrama Mahasiswa<",
      ">Semua penghuni<",
      ">Penghuni putra<",
      ">Penghuni putri<",
      ">Asrama Dana Rakca<",
    ]) {
      expect(shown).toContain(choice);
    }
  });

  it("starts on the day open, daily, from 16:00 to 17:30, required", () => {
    expect(shown).toContain('name="startsOn" value="2026-10-14"');
    expect(shown).toContain('value="2026-10-14"');
    expect(shown).toContain('value="16:00"');
    expect(shown).toContain('value="17:30"');
    expect(shown).toMatch(/name="required" checked=""/);
  });
});

describe("the form of a new one-off activity", () => {
  const shown = form({ isRoutine: false, activity: null });

  it("has Tanggal instead of the pattern fields", () => {
    for (const label of LABELS) expect(shown).toContain(label);
    expect(shown).toContain("Tanggal");
    expect(shown).toContain('name="pattern" value="once"');
    expect(shown).toContain('name="day" value="2026-10-14"');
    expect(shown).not.toContain("Pola pengulangan");
    expect(shown).not.toContain("Berlaku mulai");
    expect(shown).not.toContain("Hari tanpa kegiatan");
    expect(shown).toContain("Kegiatan non rutin baru</h2>");
  });
});

describe("the form of a change", () => {
  it("holds what the activity holds, with the version it was opened with", () => {
    const weekly = {
      ...TEST_ROW,
      pattern: "weekly" as const,
      weekdays: [3],
      daysOff: ["2026-10-21"],
    };
    const shown = form({ isRoutine: true, activity: weekly });

    expect(shown).toContain("Ubah kegiatan rutin</h2>");
    expect(shown).toContain(`name="id" value="${TEST_ROW.id}"`);
    expect(shown).toContain(`name="version" value="${TEST_ROW.version}"`);
    expect(shown).toContain('value="Apel pagi uji"');
    expect(shown).toMatch(/checked=""[^>]*value="3"|value="3"[^>]*checked=""/);
    expect(shown).toContain('name="daysOff" value="2026-10-21"');
    expect(shown).toContain('value="Apel uji"');
    expect(shown).toContain("Simpan perubahan</button>");
  });

  it("shows a day off before today without a way to take it off, and does not send it", () => {
    const withPast = { ...TEST_ROW, daysOff: ["2026-10-01", "2026-10-21"] };
    const shown = form({ isRoutine: true, activity: withPast });

    expect(shown).toContain("1 Okt 2026");
    expect(shown).not.toContain('aria-label="Hapus 1 Okt 2026"');
    expect(shown).not.toContain('value="2026-10-01"');
    expect(shown).toContain('aria-label="Hapus 21 Okt 2026"');
    expect(shown).toContain('name="daysOff" value="2026-10-21"');
  });

  it("holds the Tanggal of a one-off activity", () => {
    const shown = form({ isRoutine: false, activity: TEST_ONE_OFF });

    expect(shown).toContain("Ubah kegiatan non rutin</h2>");
    expect(shown).toContain('name="day" value="2026-10-14"');
    expect(shown).toContain(`value="${TEST_ONE_OFF.startsOn}"`);
  });
});
