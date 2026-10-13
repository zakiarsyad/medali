// Sample NIMs of this file: 9962001100 to 9962001199. None is added to
// the database.
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ScoreBoxes } from "./score-boxes";
import { ScoreForm } from "./score-form";
import type { Typed } from "./score-form-values";
import type { ScoreRow } from "./score-rows";

vi.mock("./actions", () => ({}));

const GROUP_ID = "0b4f6c1e-6f0e-4f55-9d0a-0d3c1e2f7800";
const SCORED: ScoreRow = {
  id: "0b4f6c1e-6f0e-4f55-9d0a-0d3c1e2f7801",
  name: "Ani Uji Kotak Nilai",
  nim: "9962001101",
  detailAddress: "/pengasuhan/nilai?kelompok=g&profil=a",
  attendance: "3/4",
  score: 88,
  scoredOn: "8 Okt 2026",
};
const UNSCORED: ScoreRow = {
  id: "0b4f6c1e-6f0e-4f55-9d0a-0d3c1e2f7802",
  name: "Budi Uji Kotak Nilai",
  nim: "9962001102",
  detailAddress: null,
  attendance: "-",
  score: null,
  scoredOn: null,
};
const ROWS = [SCORED, UNSCORED];

/** The rows of the table as text, one for each member, for what was typed. */
function rowsWith(typed: Typed, sentIds: string[] = []): string[] {
  const shown = renderToStaticMarkup(
    <ScoreBoxes
      rows={ROWS}
      typed={typed}
      sentIds={sentIds}
      onType={() => {}}
    />,
  );
  return shown.split("<tr").slice(2);
}

describe("ScoreBoxes", () => {
  it("has a box for each member, named for whom it is, holding the saved score or nothing", () => {
    const [scored, unscored] = rowsWith({});

    expect(scored).toContain(
      'aria-label="Nilai pengasuhan Ani Uji Kotak Nilai"',
    );
    expect(scored).toMatch(/<input[^>]*value="88"/);
    expect(unscored).toContain(
      'aria-label="Nilai pengasuhan Budi Uji Kotak Nilai"',
    );
    expect(unscored).toMatch(/<input[^>]*value=""/);
  });

  it("shows the mentee, NIM, attendance, what the rubric says of the saved score and the day it was saved", () => {
    const [scored, unscored] = rowsWith({});

    expect(scored).toContain("Ani Uji Kotak Nilai");
    expect(scored).toContain("9962001101");
    expect(scored).toContain("3/4");
    expect(scored).toContain("Sangat aktif, menjadi teladan");
    expect(scored).toContain("Diinput 8 Okt 2026");
    expect(unscored).toContain("Belum dinilai");
    expect(unscored).not.toContain("aktif");
  });

  it("shows Belum disimpan on a row whose score was changed, with what the rubric says of the typed score", () => {
    const [scored, unscored] = rowsWith({ [SCORED.id]: "70" }, [SCORED.id]);

    expect(scored).toMatch(/<input[^>]*value="70"/);
    expect(scored).toContain("Belum disimpan");
    expect(scored).toContain("Cukup aktif, perlu dorongan");
    expect(scored).not.toContain("Diinput");
    expect(unscored).not.toContain("Belum disimpan");
  });

  it("shows Belum disimpan in place of Belum dinilai once a first score is typed", () => {
    const [, unscored] = rowsWith({ [UNSCORED.id]: "90" }, [UNSCORED.id]);

    expect(unscored).toContain("Belum disimpan");
    expect(unscored).not.toContain("Belum dinilai");
  });

  it("sends only the boxes that are to be saved, each under the id of its student", () => {
    const [scored, unscored] = rowsWith({ [UNSCORED.id]: "90" }, [UNSCORED.id]);

    expect(scored).not.toContain('name="score.');
    expect(unscored).toContain(`name="score.${UNSCORED.id}"`);
  });
});

describe("ScoreForm", () => {
  const form = renderToStaticMarkup(
    <ScoreForm groupId={GROUP_ID} rows={ROWS} />,
  );

  it("opens with nothing changed: the button reads Simpan nilai and is off", () => {
    const [button = ""] = form.match(/<button[^>]*>[^<]*<\/button>/) ?? [];

    expect(button).toContain("Simpan nilai");
    expect(button).toContain('disabled=""');
    expect(form).not.toContain("Belum disimpan");
  });

  it("sends the group, never who gives the scores", () => {
    expect(form).toContain(`name="groupId" value="${GROUP_ID}"`);
    expect(form).not.toContain("scoredBy");
  });
});
