import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { mainIndicators } from "./main-indicators";
import { stageBreakdown, type TahapBreakdown } from "./stage-breakdown";
import { StagesSection } from "./stages-section";
import { type SemesterCounts, semesterCounts } from "./student-numbers";

const VALUES = mainIndicators(new Map());

const BREAKDOWNS: TahapBreakdown[] = [1, 2, 3, 4].map((tahapNo) => ({
  tahapNo,
  values: stageBreakdown(tahapNo, new Map()),
  note: "Isi awal.",
}));

/** Semester 1 holds 1.250 students and semester 3 holds 110. */
const COUNTS = semesterCounts(
  [
    { cohortYear: 2026, students: 1250 },
    { cohortYear: 2025, students: 110 },
  ],
  { startYear: 2026, term: "odd" },
);

function section({ counts = COUNTS }: { counts?: SemesterCounts } = {}) {
  return renderToStaticMarkup(
    <StagesSection
      tahapNo={1}
      onChoose={() => {}}
      activities={[]}
      breakdowns={BREAKDOWNS}
      values={VALUES}
      mayChange={false}
      mayManage={false}
      newActivityId="7c1d2e3f-4a5b-4c6d-8e7f-9a0b1c2d3e4f"
      semesterCounts={counts}
    />,
  );
}

describe("the tahap boxes", () => {
  it("show the active students of each tahap", () => {
    const html = section();

    expect(html).toContain("1.250 mahasiswa aktif");
    expect(html).toContain("110 mahasiswa aktif");
    expect(html.match(/>0 mahasiswa aktif/g)).toHaveLength(2);
  });

  it("show 0 for every tahap while no period runs", () => {
    const html = section({ counts: semesterCounts([], null) });

    expect(html.match(/>0 mahasiswa aktif/g)).toHaveLength(4);
  });
});
