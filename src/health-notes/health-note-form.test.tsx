import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { EMPTY_DRAFT, withIllness } from "./health-draft";
import type { HealthNote } from "./health-ids";
import { EarlierNotes, NoteFields, SubjectSummary } from "./health-note-fields";
import { HealthNoteForm } from "./health-note-form";

const ACTIONS = { search: vi.fn(), subject: vi.fn(), save: vi.fn() };

const WORDS = {
  placeholder: "Ketik nama atau NIM mahasiswa non asrama",
  nobodyFound: "Tidak ada mahasiswa aktif non asrama yang cocok.",
};

const TODAY = "2026-10-16";

const LATEST: HealthNote = {
  id: "00000000-0000-4000-8000-000000000911",
  examinedOn: "2026-10-12",
  examiner: null,
  illnesses: [{ illness: "asthma", note: "sejak SMP" }],
  otherHistory: "",
  medicine: "Inhaler bila perlu",
  advice: "Bawa inhaler.",
  category: "attention",
  savedBy: "Penilai Contoh",
};

const EARLIER: HealthNote = {
  ...LATEST,
  id: "00000000-0000-4000-8000-000000000912",
  examinedOn: "2026-09-01",
  examiner: "dr. Contoh",
  illnesses: [],
  medicine: "",
  advice: "Kondisi umum baik.",
  category: null,
};

/** The tag of the field sent under a name. */
function fieldNamed(html: string, name: string): string {
  return html.match(new RegExp(`<[^<]*name="${name}"[^>]*>`))?.[0] ?? "";
}

function fields(
  draft = EMPTY_DRAFT,
  examinedOn = TODAY,
  test: "excellent" | null = "excellent",
) {
  return renderToStaticMarkup(
    <NoteFields
      draft={draft}
      test={test}
      today={TODAY}
      examinedOn={examinedOn}
      onDraft={() => undefined}
      onExaminedOn={() => undefined}
    />,
  );
}

describe("Catatan kesehatan before a student is picked", () => {
  const html = renderToStaticMarkup(
    <HealthNoteForm
      today={TODAY}
      newKey="00000000-0000-4000-8000-000000000999"
      actions={ACTIONS}
      words={WORDS}
    />,
  );

  it("asks for a student in the place's words, and cannot be saved yet", () => {
    expect(html).toContain(
      'placeholder="Ketik nama atau NIM mahasiswa non asrama"',
    );
    expect(html).not.toContain("Simpan catatan");
  });

  it("carries the key of the save, so a second press sends the same one", () => {
    expect(html).toContain(
      '<input type="hidden" name="id" value="00000000-0000-4000-8000-000000000999"/>',
    );
  });
});

describe("the student picked", () => {
  it("shows Catatan terakhir and Kategori sekarang, marked as from the note", () => {
    const html = renderToStaticMarkup(
      <SubjectSummary subject={{ test: "excellent", notes: [LATEST] }} />,
    );

    expect(html).toContain(
      "Catatan terakhir: Riwayat: Asma (sejak SMP). Obat: Inhaler bila perlu. Bawa inhaler.",
    );
    expect(html).toContain("Kategori sekarang:");
    expect(html).toContain(">Perlu perhatian</span>");
    expect(html).toContain("berdasarkan catatan kesehatan");
  });

  it("says Belum ada catatan kesehatan with no note", () => {
    const html = renderToStaticMarkup(
      <SubjectSummary subject={{ test: null, notes: [] }} />,
    );

    expect(html).toContain("Belum ada catatan kesehatan.");
    expect(html).toContain(">Belum dites</span>");
    expect(html).not.toContain("berdasarkan catatan kesehatan");
  });

  it("opens the earlier notes, newest first, with Tanggal, Pemeriksa and text", () => {
    const html = renderToStaticMarkup(
      <EarlierNotes notes={[LATEST, EARLIER]} />,
    );

    expect(html).toContain("<details");
    expect(html).toContain("Catatan sebelumnya (1)");
    expect(html).toContain("1 Sep 2026");
    expect(html).toContain("dr. Contoh");
    expect(html).toContain("Kondisi umum baik.");
    expect(html).not.toContain("Bawa inhaler.");
  });

  it("shows no earlier notes when there is only the latest", () => {
    expect(renderToStaticMarkup(<EarlierNotes notes={[LATEST]} />)).toBe("");
  });
});

describe("the fields of a note", () => {
  it("offers the ten illnesses in the prototype's order", () => {
    const html = fields();
    const offered = [...html.matchAll(/type="checkbox"[^>]*\/>([^<]+)</g)].map(
      (match) => match[1],
    );

    expect(offered).toEqual([
      "Asma",
      "Hipertensi",
      "Diabetes melitus",
      "Penyakit jantung",
      "Gangguan lambung",
      "Alergi",
      "Epilepsi",
      "Cedera atau operasi tulang/sendi",
      "Penyakit menular",
      "Lainnya",
    ]);
  });

  it("gives each illness picked a short note, sent beside it", () => {
    const html = fields(withIllness(EMPTY_DRAFT, "epilepsy", true));

    expect(html).toContain("Catatan epilepsi");
    expect(html).toContain(
      '<input type="hidden" name="illness" value="epilepsy"/>',
    );
    expect(fieldNamed(html, "illnessNote")).toContain('maxLength="200"');
  });

  it("offers the four choices of Pertimbangan kategori, showing the one suggested", () => {
    const html = fields(withIllness(EMPTY_DRAFT, "epilepsy", true));

    expect(html).toContain(
      '<option value="">Ikuti hasil tes kebugaran</option>',
    );
    expect(html).toContain('<option value="good">Baik</option>');
    expect(html).toContain(
      '<option value="attention">Perlu perhatian</option>',
    );
    expect(html).toContain(
      '<option value="medical" selected="">Perlu tindak lanjut medis</option>',
    );
    expect(html).toContain(
      "Hasil tes: prima. Kategori akhir: perlu tindak lanjut medis.",
    );
  });

  it("holds the texts to their lengths, and Tanggal from today back", () => {
    const html = fields();

    for (const name of ["examiner", "otherHistory", "medicine"]) {
      expect(fieldNamed(html, name), name).toContain('maxLength="200"');
    }
    expect(fieldNamed(html, "advice")).toContain('maxLength="2000"');
    const day = fieldNamed(html, "examinedOn");
    expect(day).toContain('type="date"');
    expect(day).toContain('value="2026-10-16"');
    expect(day).toContain('max="2026-10-16"');
  });

  it("says Tanggal is after today before saving", () => {
    expect(fields(EMPTY_DRAFT, "2026-10-17")).toContain(
      "Tanggal tidak boleh setelah hari ini.",
    );
  });

  it("says belum dites with no test and no category", () => {
    expect(fields(EMPTY_DRAFT, TODAY, null)).toContain(
      "Hasil tes: belum dites. Kategori akhir: belum dites.",
    );
  });
});
