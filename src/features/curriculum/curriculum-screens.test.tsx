import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { mainIndicators } from "./main-indicators";
import type { PpksActivity } from "./ppks-activities";
import { type FormTarget, PpksPanel } from "./ppks-panel";
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

const ACTIVITY: PpksActivity = {
  id: "00000000-0000-4000-8000-000000000501",
  semester: 1,
  name: "Kegiatan uji tanpa target",
  valueKeys: ["M"],
  indicatorCodes: ["M1"],
  targetParticipants: null,
  isRequired: true,
  description: "",
  version: "2026-10-15T03:00:00.000Z",
  scheduledCount: 0,
};

const TYPED: PpksActivity = {
  ...ACTIVITY,
  id: "00000000-0000-4000-8000-000000000502",
  name: "Kegiatan uji dengan target",
  targetParticipants: 40,
};

const SPECIAL: PpksActivity = {
  ...ACTIVITY,
  id: "00000000-0000-4000-8000-000000000503",
  semester: null,
  name: "Kegiatan khusus uji",
};

function section({
  counts = COUNTS,
  activities = [],
}: {
  counts?: SemesterCounts;
  activities?: PpksActivity[];
} = {}) {
  return renderToStaticMarkup(
    <StagesSection
      tahapNo={1}
      onChoose={() => {}}
      activities={activities}
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

describe("Target peserta", () => {
  it("shows the active students of the semester, marked otomatis, for an activity without a target", () => {
    const html = section({ activities: [ACTIVITY] });

    expect(html).toMatch(
      /data-title="Target peserta">1\.250 <span[^>]*>otomatis<\/span><\/td>/,
    );
  });

  it("shows a typed target as it is, without otomatis", () => {
    const html = section({ activities: [TYPED] });

    expect(html).toContain('data-title="Target peserta">40</td>');
    expect(html).not.toContain("otomatis");
  });

  it("shows no number for a special or additional activity without a target", () => {
    const html = section({ activities: [SPECIAL] });

    expect(html).toContain('data-title="Target peserta">-</td>');
    expect(html).not.toContain("otomatis");
  });
});

describe("the activity form", () => {
  function form(semester: number | null, open: FormTarget) {
    return renderToStaticMarkup(
      <PpksPanel
        semester={semester}
        note=""
        activities={[]}
        values={VALUES}
        mayManage
        newActivityId="7c1d2e3f-4a5b-4c6d-8e7f-9a0b1c2d3e4f"
        open={open}
        isFormOpen
        onOpen={() => {}}
        onClose={() => {}}
        autoTarget={semester === null ? null : 1250}
      />,
    );
  }

  it("starts a new PPKS activity with the semester's number in Target peserta", () => {
    expect(form(1, "new")).toMatch(/name="target" value="1250"/);
  });

  it("keeps Target peserta empty when changing an activity without a target", () => {
    expect(form(1, ACTIVITY)).toMatch(/name="target" value=""/);
  });

  it("starts a special activity with Target peserta empty", () => {
    expect(form(null, "new")).toMatch(/name="target" value=""/);
  });
});
