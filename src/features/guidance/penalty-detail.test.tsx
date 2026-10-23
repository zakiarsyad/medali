// Sample NIMs of this file: 9944270000 to 9944270099. None is added to
// the database.
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { PenaltyDetail } from "./penalty-detail";
import type { OpenedPenalty } from "./penalty-detail-read";
import { CONTINUATION_CONDITIONS } from "./penalty-ids";

vi.mock("./penalty-actions", () => ({
  changePenaltyConditionAction: vi.fn(),
  changePenaltyDecisionAction: vi.fn(),
}));

const ROW: OpenedPenalty = {
  id: "p1",
  name: "Mega Saragih",
  description: "Terlambat mengikuti apel pagi tiga kali dalam satu bulan.",
  category: "light",
  level: 1,
  status: "imposed",
  decisionNumber: "",
  socialWorkForms: ["grounds", "other"],
  socialWorkOther: "Menata arsip perpustakaan",
  socialWorkPlace: "campus",
  socialWorkStartsOn: "2026-10-15",
  socialWorkEndsOn: "2026-10-21",
  savedByName: "Agus Hermawan",
  semester: 3,
  conditionsMet: [],
  decision: "pending",
  version: 1,
  hasAgency: false,
};

function detail(penalty: OpenedPenalty, mayFollowUp = false): string {
  return renderToStaticMarkup(
    <PenaltyDetail
      penalty={penalty}
      mayFollowUp={mayFollowUp}
      onFollowUp={() => undefined}
    />,
  );
}

const SUSPENDED: OpenedPenalty = {
  ...ROW,
  category: "heavy",
  level: 1,
  hasAgency: true,
  conditionsMet: ["served", "academic"],
};

const CONTINUE_LINE =
  "&quot;Melanjutkan studi&quot; tersedia setelah semua syarat dicentang.";

describe("PenaltyDetail", () => {
  it("shows Uraian, the kerja sosial form, place and dates, who recorded it, Dasar and the cap on nilai karakter", () => {
    const shown = detail(ROW);
    expect(shown).toContain(ROW.description);
    expect(shown).toContain(
      "Merapikan dan membersihkan taman atau lingkungan PKN STAN; Lainnya: Menata arsip perpustakaan",
    );
    expect(shown).toContain("Unit kerja di lingkungan PKN STAN");
    expect(shown).toContain("15 Okt 2026 – 21 Okt 2026");
    expect(shown).toContain("Belum diisi");
    expect(shown).toContain("Agus Hermawan");
    expect(shown).toContain("ayat (2) huruf a");
    expect(shown).toContain("Nilai karakter paling tinggi 70");
  });

  it("shows the suspension of Berat jenjang pertama from the semester of the Tanggal, and its Nomor keputusan", () => {
    const shown = detail({
      ...ROW,
      category: "heavy",
      level: 1,
      decisionNumber: "KEP-009/PKN/2026",
    });
    expect(shown).toContain("KEP-009/PKN/2026");
    expect(shown).toContain(
      "Semester 3–4; mengulang seluruh mata kuliah semester 3",
    );
    expect(shown).not.toContain("paling tinggi 70");
  });

  it("shows no kerja sosial and no effect on nilai karakter for a penalty that ends the status", () => {
    const shown = detail({
      ...ROW,
      category: "heavy",
      level: 3,
      status: "set",
      socialWorkForms: [],
      socialWorkOther: "",
      socialWorkPlace: null,
      socialWorkStartsOn: null,
      socialWorkEndsOn: null,
    });
    expect(shown).not.toContain("Bentuk kerja sosial");
    expect(shown).not.toContain("Dampak nilai");
    expect(shown).toContain("ayat (4) huruf c");
  });

  it("shows a reader each condition as Terpenuhi or Belum terpenuhi and the Keputusan, with nothing to press", () => {
    const shown = detail(SUSPENDED);
    expect(shown).toContain("Syarat melanjutkan studi (ayat 7)");
    expect(shown).toContain(
      "Terpenuhi: Telah selesai menjalani hukuman disiplin berat jenjang pertama",
    );
    expect(shown).toContain(
      "Belum terpenuhi: Memenuhi kurikulum pembangunan karakter",
    );
    expect(shown).toContain("<b>Keputusan:</b> Menunggu pemenuhan syarat");
    expect(shown).not.toContain("<input");
    expect(shown).not.toContain("<select");
  });

  it("gives an account that follows up five ticks and Keputusan, with Melanjutkan studi closed while a tick is missing", () => {
    const shown = detail(SUSPENDED, true);
    expect(shown.match(/type="checkbox"/g)).toHaveLength(5);
    expect(shown.match(/checked=""/g)).toHaveLength(2);
    expect(shown).toMatch(
      /<option value="continue" disabled="">Melanjutkan studi<\/option>/,
    );
    expect(shown).toContain(">Diberhentikan dengan hormat (ayat 8)</option>");
    expect(shown).toContain(CONTINUE_LINE);
  });

  it("opens Melanjutkan studi once all five are ticked", () => {
    const shown = detail(
      { ...SUSPENDED, conditionsMet: [...CONTINUATION_CONDITIONS] },
      true,
    );
    expect(shown).toContain(
      '<option value="continue">Melanjutkan studi</option>',
    );
    expect(shown).not.toContain(CONTINUE_LINE);
  });

  it.each([
    ["a student without an Instansi asal", { ...SUSPENDED, hasAgency: false }],
    [
      "a penalty other than Berat jenjang pertama",
      { ...SUSPENDED, level: 2 as const },
    ],
  ])("shows no conditions for %s", (_, row) => {
    expect(detail(row, true)).not.toContain("Syarat melanjutkan studi");
  });
});
