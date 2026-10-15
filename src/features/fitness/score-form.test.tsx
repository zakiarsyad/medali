import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { STARTING_LIMITS } from "./fitness-ids";
import { ScoreForm } from "./score-form";

const GROUPS = [
  {
    id: "00000000-0000-4000-8000-000000000701",
    code: "KP 26-D3PJK-01",
    members: 12,
  },
];

function shownForm(): string {
  return renderToStaticMarkup(
    <ScoreForm
      groups={GROUPS}
      today="2026-10-16"
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
});
