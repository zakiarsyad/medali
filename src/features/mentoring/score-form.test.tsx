// Sample NIMs of this file: 9962001100 to 9962001199. None is added to
// the database.
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { STARTING_INDICATORS } from "@/mentoring/score-indicators";
import { ScoreBoxes } from "./score-boxes";
import { ScoreForm } from "./score-form";
import type { Typed } from "./score-form-values";
import type { ScoreRow } from "./score-rows";

vi.mock("./actions", () => ({}));

const NAMES = STARTING_INDICATORS.map((indicator) => indicator.name);
const GROUP_ID = "0b4f6c1e-6f0e-4f55-9d0a-0d3c1e2f7800";
const SCORED: ScoreRow = {
  id: "0b4f6c1e-6f0e-4f55-9d0a-0d3c1e2f7801",
  name: "Ani Uji Kotak Nilai",
  nim: "9962001101",
  detailAddress: "/pengasuhan/nilai?kelompok=g&profil=a",
  attendance: "3/4",
  score: 90,
  indicatorScores: [5, 5, 4, 4, 5, 4],
  indicatorNames: NAMES,
  scoredOn: "8 Okt 2026",
};
const UNSCORED: ScoreRow = {
  id: "0b4f6c1e-6f0e-4f55-9d0a-0d3c1e2f7802",
  name: "Budi Uji Kotak Nilai",
  nim: "9962001102",
  detailAddress: null,
  attendance: "-",
  score: null,
  indicatorScores: null,
  indicatorNames: null,
  scoredOn: null,
};
const BEFORE: ScoreRow = {
  id: "0b4f6c1e-6f0e-4f55-9d0a-0d3c1e2f7803",
  name: "Cici Uji Kotak Nilai",
  nim: "9962001103",
  detailAddress: null,
  attendance: "2/4",
  score: 72,
  indicatorScores: null,
  indicatorNames: null,
  scoredOn: "1 Okt 2026",
};
const ROWS = [SCORED, UNSCORED, BEFORE];

const SIX_70 = ["4", "4", "3", "3", "4", "3"];

/** The rows of the table as text, one for each member, for what was chosen. */
function rowsWith(typed: Typed, sentIds: string[] = []): string[] {
  const shown = renderToStaticMarkup(
    <ScoreBoxes
      rows={ROWS}
      names={NAMES}
      typed={typed}
      sentIds={sentIds}
      onChoose={() => {}}
    />,
  );
  return shown.split("<tr").slice(2);
}

/** The value each of the six choices of a row shows. */
function chosenIn(row: string): string[] {
  const selects = row.match(/<select[\s\S]*?<\/select>/g) ?? [];
  return selects.map((select) => {
    const picked = select.match(/<option value="(\d?)" selected="">/);
    return picked?.[1] ?? "";
  });
}

describe("ScoreBoxes", () => {
  it("heads a column with each of the six indicator names, then Nilai akhir and Keterangan", () => {
    const shown = renderToStaticMarkup(
      <ScoreBoxes
        rows={ROWS}
        names={NAMES}
        typed={{}}
        sentIds={[]}
        onChoose={() => {}}
      />,
    );

    const heads = [...shown.matchAll(/<th>([^<]*)<\/th>/g)].map(
      (head) => head[1],
    );
    expect(heads).toEqual([
      "Anak asuh",
      "Kehadiran pengasuhan",
      ...NAMES,
      "Nilai akhir",
      "Keterangan",
    ]);
  });

  it("gives each member six choices from 1 to 5 with what each means, named for whom and which indicator they are", () => {
    const [scored, unscored] = rowsWith({});

    expect(scored?.match(/<select/g)).toHaveLength(6);
    expect(scored).toContain('aria-label="Mandiri Ani Uji Kotak Nilai"');
    expect(scored).toContain('aria-label="Integritas Ani Uji Kotak Nilai"');
    expect(scored).toContain('<option value="1">1 Sangat kurang</option>');
    expect(scored).toContain('<option value="">-</option>');
    expect(chosenIn(scored ?? "")).toEqual(["5", "5", "4", "4", "5", "4"]);
    expect(chosenIn(unscored ?? "")).toEqual(["", "", "", "", "", ""]);
  });

  it("shows the saved Nilai akhir, what the rubric says of it and the day it was saved", () => {
    const [scored, unscored] = rowsWith({});

    expect(scored).toContain("<b>90</b>");
    expect(scored).toContain("Sangat aktif, menjadi teladan");
    expect(scored).toContain("Diinput 8 Okt 2026");
    expect(unscored).toContain("<b>-</b>");
    expect(unscored).toContain("Belum dinilai");
  });

  it("shows a score given before the indicators with Nilai tanpa indikator, its six choices empty", () => {
    const [, , before] = rowsWith({});

    expect(before).toContain("<b>72</b>");
    expect(before).toContain("Nilai tanpa indikator");
    expect(before).toContain("Diinput 1 Okt 2026");
    expect(chosenIn(before ?? "")).toEqual(["", "", "", "", "", ""]);
  });

  it("shows Nilai akhir of the six chosen at once, with Belum disimpan and what the rubric says of it", () => {
    const [scored, unscored] = rowsWith(
      {
        [SCORED.id]: SIX_70,
        [UNSCORED.id]: ["4", "5", "4", "3", "5", "4"],
      },
      [SCORED.id, UNSCORED.id],
    );

    expect(scored).toContain("<b>70</b>");
    expect(scored).toContain("Belum disimpan");
    expect(scored).toContain("Cukup aktif, perlu dorongan");
    expect(scored).not.toContain("Diinput");
    expect(unscored).toContain("<b>83,3</b>");
    expect(unscored).not.toContain("Belum dinilai");
  });

  it("says Lengkapi enam indikator on a row with only part of the six, with no Nilai akhir, and marks its choices", () => {
    const [scored, unscored] = rowsWith(
      { [UNSCORED.id]: ["4", "", "4", "4", "", "4"] },
      [UNSCORED.id],
    );

    expect(unscored).toContain("Lengkapi enam indikator");
    expect(unscored).toContain("<b>-</b>");
    expect(unscored).toMatch(/<select[^>]*aria-invalid="true"/);
    expect(unscored).not.toContain("aktif");
    expect(scored).not.toContain("Lengkapi");
    expect(scored).not.toContain("aria-invalid");
  });

  it("sends only the rows that are to be saved, each choice under the id of its student and its place", () => {
    const [scored, unscored] = rowsWith({ [UNSCORED.id]: SIX_70 }, [
      UNSCORED.id,
    ]);

    expect(scored).not.toContain('name="score.');
    for (let place = 0; place < 6; place++) {
      expect(unscored).toContain(`name="score.${UNSCORED.id}.${place}"`);
    }
  });

  it("sends with each such row what it was opened on, so a score saved in between is not written over", () => {
    const typed = {
      [SCORED.id]: SIX_70,
      [UNSCORED.id]: SIX_70,
      [BEFORE.id]: SIX_70,
    };
    const [scored, unscored, before] = rowsWith(typed, [
      SCORED.id,
      UNSCORED.id,
      BEFORE.id,
    ]);
    const [untouched] = rowsWith({});

    expect(scored).toContain(
      `<input type="hidden" name="based.${SCORED.id}" value="5,5,4,4,5,4"/>`,
    );
    expect(unscored).toContain(
      `<input type="hidden" name="based.${UNSCORED.id}" value=""/>`,
    );
    expect(before).toContain(
      `<input type="hidden" name="based.${BEFORE.id}" value="72"/>`,
    );
    expect(untouched).not.toContain('name="based.');
  });
});

describe("ScoreForm", () => {
  const form = renderToStaticMarkup(
    <ScoreForm
      groupId={GROUP_ID}
      rows={ROWS}
      names={NAMES}
      indicatorsVersion="start"
    />,
  );

  it("opens with nothing changed: the button reads Simpan nilai and is off", () => {
    const [button = ""] = form.match(/<button[^>]*>[^<]*<\/button>/) ?? [];

    expect(button).toContain("Simpan nilai");
    expect(button).toContain('disabled=""');
    expect(form).not.toContain("Belum disimpan");
  });

  it("sends the group and the indicators it was opened on, never who gives the scores", () => {
    expect(form).toContain(`name="groupId" value="${GROUP_ID}"`);
    expect(form).toContain('name="indicatorsVersion" value="start"');
    expect(form).not.toContain("scoredBy");
  });
});
