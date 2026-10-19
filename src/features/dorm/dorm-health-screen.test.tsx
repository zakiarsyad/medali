import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { RecapRow } from "@/health-notes/sick-list";
import type { DormHealthList, DormHealthNumbersOnly } from "./dorm-health";
import {
  DORM_HEALTH_START,
  type DormHealthParams,
} from "./dorm-health-address";
import { DormHealthNoteForm } from "./dorm-health-note-panel";
import { DormHealthScreen } from "./dorm-health-screen";
import { LIST_READER_NOTE, NUMBERS_ONLY_NOTE } from "./dorm-health-words";

vi.mock("next/navigation", () => ({ useRouter: () => ({}) }));
vi.mock("./dorm-health-actions", () => ({
  dormHealthSubjectAction: vi.fn(),
  saveDormHealthNoteAction: vi.fn(),
  searchDormHealthStudentsAction: vi.fn(),
}));

const TABS = { pagePath: "asrama", tabs: [], open: "sehat" };

const ANI: RecapRow = {
  id: "00000000-0000-4000-8000-000000000961",
  name: "Ani Contoh",
  nim: "9986300161",
  program: "D3 Pajak",
  dorm: "dana_rakca",
  room: { dorm: "dana_rakca", floor: 2, number: "12" },
  mentorName: "Pengasuh Contoh",
  final: { category: "attention", fromNote: true },
  note: {
    id: "00000000-0000-4000-8000-000000000962",
    examinedOn: "2026-10-12",
    examiner: null,
    illnesses: [{ illness: "asthma", note: "sejak SMP" }],
    otherHistory: "",
    medicine: "",
    advice: "Bawa inhaler.",
    category: "attention",
    savedBy: "BAM Contoh",
  },
};

const FOUND: DormHealthList = {
  list: {
    numbers: {
      students: 40,
      dorm: 40,
      listed: 6,
      attention: 2,
      medical: 1,
      medicalWithoutNote: 1,
    },
    rows: [ANI],
    matching: 1,
    page: 1,
  },
  reach: { kind: "all" },
};

function screen(
  found: DormHealthList | null,
  params: DormHealthParams = DORM_HEALTH_START,
) {
  return renderToStaticMarkup(
    <DormHealthScreen
      tabs={TABS}
      found={found}
      params={params}
      form={null}
      readOnlyNote={LIST_READER_NOTE}
    />,
  );
}

describe("Asrama > Kesehatan for a reader of the list", () => {
  const html = screen(FOUND);

  it("shows the four numbers with their hints", () => {
    expect(html).toContain("Penghuni asrama");
    expect(html).toContain("Wismantara, Dana Rakca, Cipta Bakti");
    expect(html).toContain("Sakit atau punya riwayat penyakit");
    expect(html).toContain("15% penghuni");
    expect(html).toContain("Perlu perhatian");
    expect(html).toContain("pemantauan");
    expect(html).toContain("Perlu tindak lanjut medis");
    expect(html).toContain("1 belum punya catatan");
  });

  it("says who fills the notes, with no form", () => {
    expect(html).toContain(LIST_READER_NOTE);
    expect(html).not.toContain("Simpan catatan");
  });

  it("lists the sick residents with the prototype's columns, as cards on a phone", () => {
    expect(html).toContain("Mahasiswa asrama yang sakit");
    expect(html).toMatch(/<table class="[^"]*stacked/);
    for (const title of [
      "Mahasiswa",
      "Kamar",
      "Pengasuh",
      "Kategori",
      "Riwayat penyakit dan catatan",
      "Dicatat",
    ]) {
      expect(html).toContain(`data-title="${title}"`);
    }
    expect(html).toContain("Dana Rakca, lantai 2, kamar 12");
    expect(html).toContain("Riwayat: Asma (sejak SMP). Bawa inhaler.");
    expect(html).toContain("BAM Contoh");
  });

  it("offers the search and the filters by dorm, category and illness", () => {
    expect(html).toContain('placeholder="Cari nama atau NIM"');
    for (const first of [
      "Semua asrama",
      "Semua kategori",
      "Semua riwayat penyakit",
    ]) {
      expect(html).toMatch(new RegExp(`<option value=""[^>]*>${first}<`));
    }
    expect(html).toContain('<option value="cipta_bakti">Cipta Bakti</option>');
    expect(html).toContain('<option value="medis">Perlu tindak lanjut medis');
    expect(html).toContain('<option value="alergi">Alergi</option>');
    expect(html).not.toContain(">Lainnya</option>");
  });

  it("names how many residents have the illness filtered by", () => {
    expect(
      screen(FOUND, { ...DORM_HEALTH_START, illness: "asthma" }),
    ).toContain("1 mahasiswa asrama dengan riwayat asma.");
  });

  it("says so when nobody matches", () => {
    const none = { ...FOUND, list: { ...FOUND.list, rows: [], matching: 0 } };
    expect(screen(none)).toContain(
      "Tidak ada mahasiswa asrama yang sakit pada filter ini.",
    );
  });
});

describe("Asrama > Kesehatan for an account that may not read the list", () => {
  const html = screen(null);

  it("shows no number, name, search or filter", () => {
    expect(html).not.toContain("Penghuni asrama");
    expect(html).not.toContain("Mahasiswa asrama yang sakit");
    expect(html).not.toContain("Cari nama atau NIM");
    expect(html).not.toContain("<select");
  });
});

function numbersOnly(counts: DormHealthNumbersOnly["counts"]) {
  return renderToStaticMarkup(
    <DormHealthScreen
      tabs={TABS}
      found={null}
      counts={{
        counts,
        reach: {
          kind: "some",
          studyProgramIds: [7],
          menteesOf: [],
          studentIds: [],
        },
      }}
      params={DORM_HEALTH_START}
      form={null}
      readOnlyNote={NUMBERS_ONLY_NOTE}
    />,
  );
}

describe("Asrama > Kesehatan for Direktur or Ketua Program Studi", () => {
  const html = numbersOnly({
    kind: "shown",
    residents: 40,
    listed: 6,
    attention: "<5",
    medical: 0,
    medicalWithoutNote: 0,
    listedShare: 15,
  });

  it("shows the four numbers, <5 for 1 to 4, with no list, search or filter", () => {
    expect(html).toContain("Penghuni asrama");
    expect(html).toContain("prodi Anda");
    expect(html).toContain("15% penghuni");
    expect(html).toContain("&lt;5");
    expect(html).toContain("catatan lengkap");
    expect(html).not.toContain("Mahasiswa asrama yang sakit");
    expect(html).not.toContain("Cari nama atau NIM");
    expect(html).not.toContain("<select");
    expect(html).not.toContain("<table");
  });

  it("says that only the numbers show, with no form", () => {
    expect(html).toContain(NUMBERS_ONLY_NOTE);
    expect(html).not.toContain("Simpan catatan");
  });

  it("shows only the line of the minimum below 5 residents", () => {
    const few = numbersOnly({ kind: "too_few" });
    expect(few).toContain(
      "Rekap ditampilkan setelah minimal 5 penghuni, agar identitas tidak dapat ditebak.",
    );
    expect(few).not.toContain("Penghuni asrama");
    expect(few).not.toContain("Perlu perhatian");
  });
});

describe("Asrama > Kesehatan for a writer", () => {
  const html = renderToStaticMarkup(
    <DormHealthScreen
      tabs={TABS}
      found={FOUND}
      params={DORM_HEALTH_START}
      form={
        <DormHealthNoteForm
          today="2026-10-16"
          newKey="00000000-0000-4000-8000-000000000969"
        />
      }
      readOnlyNote={LIST_READER_NOTE}
    />,
  );

  it("shows Catatan kesehatan with the form for residents in place of the note", () => {
    expect(html).toContain("Catatan kesehatan");
    expect(html).toContain("Untuk penghuni asrama.");
    expect(html).toContain('placeholder="Ketik nama atau NIM penghuni asrama"');
    expect(html).not.toContain(LIST_READER_NOTE);
  });

  it("carries the key of the save, so a second press sends the same one", () => {
    expect(html).toContain(
      '<input type="hidden" name="id" value="00000000-0000-4000-8000-000000000969"/>',
    );
  });
});
