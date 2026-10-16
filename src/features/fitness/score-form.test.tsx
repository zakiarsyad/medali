import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { STARTING_LIMITS } from "@/health-notes/fitness-ids";
import { SCORE_NOT_WHOLE } from "./fitness-input";
import { MemberTable, ScoreForm } from "./score-form";

const GROUPS = [
  {
    id: "00000000-0000-4000-8000-000000000701",
    code: "KP 26-D3PJK-01",
    members: 12,
  },
];

const ANI = {
  id: "00000000-0000-4000-8000-000000000711",
  name: "Ani Contoh",
  nim: "9986070001",
  latestScore: 80,
};

function shownForm(today = "2026-10-16"): string {
  return renderToStaticMarkup(
    <ScoreForm
      groups={GROUPS}
      today={today}
      limits={STARTING_LIMITS}
      newKey="00000000-0000-4000-8000-000000000799"
    />,
  );
}

describe("the group form of Input hasil tes kebugaran", () => {
  it("offers the groups in force by code and size, and asks for one first", () => {
    const page = shownForm();

    expect(page).toContain("Kelompok mahasiswa");
    expect(page).toContain(">Pilih kelompok pengasuhan…</option>");
    expect(page).toContain(">KP 26-D3PJK-01 (12)</option>");
    expect(page).toContain(
      "Pilih kelompok untuk mengisi skor seluruh anggotanya sekaligus.",
    );
    expect(page).not.toContain("Simpan skor");
  });

  it("starts Tanggal tes at today, no later, and shows its year in Tahun tes, which cannot be typed and is not sent", () => {
    const page = shownForm();

    const day = page.match(/<input type="date"[^>]*>/)?.[0] ?? "";
    expect(day, page).toContain('name="testedOn"');
    expect(day).toContain('value="2026-10-16"');
    expect(day).toContain('max="2026-10-16"');
    const year = page.match(/Tahun tes<input[^>]*>/)?.[0] ?? "";
    expect(year).toContain('value="2026"');
    expect(year).toContain("readOnly");
    expect(year).not.toContain("name=");
  });

  it("carries the key of the save, so a second press sends the same one", () => {
    expect(shownForm()).toContain(
      '<input type="hidden" name="id" value="00000000-0000-4000-8000-000000000799"/>',
    );
  });

  it("shows the year of the date Tanggal tes holds in Tahun tes", () => {
    const page = shownForm("2025-12-31");

    const year = page.match(/Tahun tes<input[^>]*>/)?.[0] ?? "";
    expect(year, page).toContain('value="2025"');
  });
});

function categoryShownFor(typed: string): string {
  const page = renderToStaticMarkup(
    <MemberTable
      members={[ANI]}
      typed={{ [ANI.id]: typed }}
      limits={STARTING_LIMITS}
      onType={() => undefined}
    />,
  );
  const cell = page.match(/<td data-title="Kategori">(.*?)<\/td>/);
  expect(cell, page).not.toBeNull();
  return cell?.[1] ?? "";
}

describe("the category beside each Skor baru, with the starting limits 85/70/55", () => {
  it.each([
    ["72", ">Baik</span>"],
    ["54", ">Perlu tindak lanjut medis</span>"],
  ])("shows %j as %s", (typed, badge) => {
    expect(categoryShownFor(typed)).toContain(badge);
  });

  it("shows no badge for an empty field", () => {
    expect(categoryShownFor("")).toBe("");
    expect(categoryShownFor("  ")).toBe("");
  });

  it.each(["101", "72.5"])(
    "flags %j as no whole score before saving",
    (typed) => {
      const shown = categoryShownFor(typed);
      expect(shown).toContain(SCORE_NOT_WHOLE);
      expect(shown).not.toContain("Baik");
    },
  );
});
