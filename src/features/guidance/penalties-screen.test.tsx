// Sample NIMs of this file: 9944260000 to 9944260099. None is added to
// the database.
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { PenaltiesScreen } from "./penalties-screen";
import { PENALTIES_START } from "./penalty-address";
import type { PenaltyBoard, PenaltyRow } from "./penalty-board";
import type { OpenedPenalty } from "./penalty-detail-read";
import type { RincianAsks } from "./penalty-rincian";

vi.mock("next/form", () => ({
  default: ({ children }: { children: unknown }) => children,
}));

vi.mock("./penalty-actions", () => ({
  changePenaltyStatusAction: vi.fn(),
  changePenaltyConditionAction: vi.fn(),
  changePenaltyDecisionAction: vi.fn(),
}));

const ROW: PenaltyRow = {
  id: "p1",
  studentId: "s1",
  name: "Mega Saragih",
  nim: "9944260013",
  program: "D3 Pajak",
  day: "2026-10-14",
  category: "light",
  level: 1,
  status: "imposed",
  socialWorkEndsOn: "2026-10-21",
  version: 1,
};

const DISMISSED: PenaltyRow = {
  ...ROW,
  id: "p2",
  category: "heavy",
  level: 2,
  status: "set",
  socialWorkEndsOn: null,
};

const URAIAN = "Terlambat mengikuti apel pagi tiga kali dalam satu bulan.";

const DECISION_NUMBER = "KEP-021/PKN/2026";

/** What the server would give once "Rincian" is opened; never asked here. */
const ASKS: RincianAsks = {
  penalty: vi.fn(
    async (): Promise<OpenedPenalty> => ({
      id: "p2",
      name: "Mega Saragih",
      description: URAIAN,
      category: "heavy",
      level: 2,
      status: "set",
      decisionNumber: DECISION_NUMBER,
      socialWorkForms: [],
      socialWorkOther: "",
      socialWorkPlace: null,
      socialWorkStartsOn: null,
      socialWorkEndsOn: null,
      savedByName: "Agus Hermawan",
      semester: 3,
      conditionsMet: [],
      decision: "pending",
      version: 1,
      hasAgency: false,
    }),
  ),
  counselling: vi.fn(async () => "Tugaskan konseling wajib"),
};

function board(rows: PenaltyRow[], menteesOnly = false): PenaltyBoard {
  return {
    numbers: { light: 4, medium: 2, heavy: 1, unfinishedWork: 3 },
    list: { rows, matching: rows.length, page: 1 },
    menteesOnly,
  };
}

function screen(
  rows: PenaltyRow[],
  form: string | null,
  menteesOnly = false,
  mayFollowUp = false,
): string {
  return renderToStaticMarkup(
    <PenaltiesScreen
      tabs={{ pagePath: "pembinaan", tabs: [], open: "disiplin" }}
      board={board(rows, menteesOnly)}
      params={PENALTIES_START}
      form={form}
      mayFollowUp={mayFollowUp}
      asks={ASKS}
    />,
  );
}

describe("PenaltiesScreen", () => {
  it("shows the four numbers", () => {
    const shown = screen([ROW], null);
    for (const label of [
      "Pelanggaran ringan",
      "Pelanggaran sedang",
      "Pelanggaran berat",
      "Kerja sosial belum selesai",
    ]) {
      expect(shown).toContain(label);
    }
  });

  it("gives a reader the line on who records, and no form", () => {
    const shown = screen([ROW], null);
    expect(shown).toContain(
      "Pencatatan pelanggaran dilakukan oleh Kepala Unit Pembangunan Karakter dan Pembina Disiplin Mahasiswa.",
    );
    expect(shown).not.toContain("Menampilkan mahasiswa binaan Anda.");
  });

  it("gives an account that records the form in place of that line", () => {
    const shown = screen([ROW], "FORMULIR");
    expect(shown).toContain("FORMULIR");
    expect(shown).not.toContain("Pencatatan pelanggaran dilakukan");
  });

  it("tells Pengasuh the list holds their own mentees", () => {
    expect(screen([ROW], null, true)).toContain(
      "Menampilkan mahasiswa binaan Anda.",
    );
  });

  it("shows a penalty with its student, Jenjang, penalty, kerja sosial and status", () => {
    const shown = screen([ROW, DISMISSED], null);
    expect(shown).toContain("Daftar pelanggaran");
    expect(shown).toContain("9944260013 · D3 Pajak");
    expect(shown).toContain("Ringan · jenjang pertama");
    expect(shown).toContain("Teguran lisan tertulis");
    expect(shown).toContain("7 hari");
    expect(shown).toContain("s.d. 21 Okt 2026");
    expect(shown).toContain("Dijatuhkan");
    expect(shown).toContain("Berat · jenjang kedua");
    expect(shown).toContain("Ditetapkan");
    expect(shown).toContain("Rincian");
  });

  it("holds nothing of Rincian before it is opened, and asks the server nothing", () => {
    const shown = screen([ROW, DISMISSED], "FORMULIR", false, true);
    expect(shown).not.toContain(URAIAN);
    expect(shown).not.toContain(DECISION_NUMBER);
    expect(shown).not.toContain("Agus Hermawan");
    expect(shown).not.toContain("Tugaskan konseling wajib");
    expect(shown).not.toContain("Memuat rincian");
    expect(ASKS.penalty).not.toHaveBeenCalled();
    expect(ASKS.counselling).not.toHaveBeenCalled();
  });

  it("makes each name open the student's profile over the tab, keeping the search and the page", () => {
    const shown = renderToStaticMarkup(
      <PenaltiesScreen
        tabs={{ pagePath: "pembinaan", tabs: [], open: "disiplin" }}
        board={board([ROW])}
        params={{ ...PENALTIES_START, query: "Mega", page: 2 }}
        form={null}
        mayFollowUp={false}
        asks={ASKS}
      />,
    );
    expect(shown).toMatch(
      /<a [^>]*href="\/pembinaan\/disiplin\?cari=Mega&amp;hal=2&amp;profil=s1"[^>]*><b[^>]*>Mega Saragih<\/b><\/a>/,
    );
  });

  it("counts the kerja sosial that is Dijatuhkan or Sedang dijalani, not by its last day", () => {
    const shown = screen([ROW], null);
    expect(shown).toContain("dijatuhkan atau sedang dijalani");
    expect(shown).not.toContain("berakhir hari ini");
  });

  it("gives an account that follows up a status choice of the three, and Ditetapkan as a label that cannot change", () => {
    const shown = screen([ROW, DISMISSED], "FORMULIR", false, true);
    const choices = [
      ...shown.matchAll(
        /<select[^>]*aria-label="Status hukuman"[^>]*>(.*?)<\/select>/g,
      ),
    ];
    expect(choices).toHaveLength(1);
    const options = choices[0]?.[1] ?? "";
    for (const word of ["Dijatuhkan", "Sedang dijalani", "Selesai dijalani"]) {
      expect(options).toContain(`>${word}</option>`);
    }
    expect(options).not.toContain("Ditetapkan");
    expect(shown).toContain(">Ditetapkan</span>");
  });

  it("shows a reader the status as a label, with nothing to choose", () => {
    const shown = screen([{ ...ROW, status: "serving" }], null);
    expect(shown).not.toContain('aria-label="Status hukuman"');
    expect(shown).toContain(">Sedang dijalani</span>");
  });

  it("says so when no penalty matches", () => {
    expect(screen([], null)).toContain(
      "Belum ada pelanggaran pada filter ini.",
    );
  });

  it("shows the rules of all nine Jenjang with their legal basis", () => {
    const shown = screen([], null);
    expect(shown).toContain("Ketentuan hukuman disiplin");
    for (const basis of [
      "ayat (2) huruf a",
      "ayat (3) huruf c",
      "ayat (4) huruf c",
    ]) {
      expect(shown).toContain(basis);
    }
    expect(shown).toContain("Paling tinggi 70");
    expect(shown).toContain("Mengulang semester berkenaan");
    expect(shown).toContain("8 bulan");
  });
});
