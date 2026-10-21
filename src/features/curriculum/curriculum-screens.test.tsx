import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BreakdownForm } from "./breakdown-form";
import { mainIndicators } from "./main-indicators";
import type { PpksActivity } from "./ppks-activities";
import { type FormTarget, PpksPanel } from "./ppks-panel";
import { stageBreakdown, type TahapBreakdown } from "./stage-breakdown";
import { StagesSection } from "./stages-section";
import { type SemesterCounts, semesterCounts } from "./student-numbers";
import type { TahapScores } from "./tahap-scores";

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
  targetParticipants: 1240,
};

const SPECIAL: PpksActivity = {
  ...ACTIVITY,
  id: "00000000-0000-4000-8000-000000000503",
  semester: null,
  name: "Kegiatan khusus uji",
};

/** Tahap 1 with assessed students; the others with none. */
const SCORES: (TahapScores | null)[] = [
  {
    values: { M: 85, E: 69, D: 77, A: 72, L: 81.5, I: 64.9 },
    rerata: 78.3,
  },
  null,
  null,
  null,
];

function section({
  counts = COUNTS,
  activities = [],
  scores = SCORES,
}: {
  counts?: SemesterCounts;
  activities?: PpksActivity[];
  scores?: (TahapScores | null)[];
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
      scores={scores}
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

  it("shows a typed target with a thousands dot, without otomatis", () => {
    const html = section({ activities: [TYPED] });

    expect(html).toContain('data-title="Target peserta">1.240</td>');
    expect(html).not.toContain("otomatis");
  });

  it("shows no number for a special or additional activity without a target", () => {
    const html = section({ activities: [SPECIAL] });

    expect(html).toContain('data-title="Target peserta">-</td>');
    expect(html).not.toContain("otomatis");
  });
});

describe("the activity form", () => {
  function form(
    semester: number | null,
    open: FormTarget,
    counted: number | null = semester === null ? null : 1250,
  ) {
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
        autoTarget={counted}
      />,
    );
  }

  it("starts a new PPKS activity with the semester's number in Target peserta", () => {
    expect(form(1, "new")).toMatch(/name="target" value="1250"/);
  });

  it("starts a new PPKS activity with Target peserta empty when no active student is counted", () => {
    expect(form(1, "new", 0)).toMatch(/name="target" value=""/);
  });

  it("fills Target peserta with the plain typed number when changing an activity with a target", () => {
    expect(form(1, TYPED)).toMatch(/name="target" value="1240"/);
  });

  it("keeps Target peserta empty when changing an activity without a target", () => {
    expect(form(1, ACTIVITY)).toMatch(/name="target" value=""/);
  });

  it("starts a special activity with Target peserta empty", () => {
    expect(form(null, "new")).toMatch(/name="target" value=""/);
  });
});

describe("Penjabaran MEDALI", () => {
  it("shows Rerata tahap and the score of each nilai, coloured by its predikat", () => {
    const html = section();

    expect(html).toContain("Rerata tahap 78,3");
    expect(html).toMatch(/_emas_[^"]*"><\/i>85,0/);
    expect(html).toMatch(/_perak_[^"]*"><\/i>77,0/);
    expect(html).toMatch(/_perunggu_[^"]*"><\/i>72,0/);
    expect(html).toMatch(/_bina_[^"]*"><\/i>64,9/);
  });

  it("sends back the version of the box its form was opened on", () => {
    const [value] = stageBreakdown(2, new Map());
    if (!value) throw new Error("The tahap has no box.");

    const html = renderToStaticMarkup(
      <BreakdownForm
        tahapNo={2}
        value={{ ...value, version: "2026-10-21T03:00:00.000Z" }}
        indicators={VALUES[0]?.indicators ?? []}
        onSaved={() => {}}
        onCancel={() => {}}
      />,
    );

    expect(html).toContain(
      '<input type="hidden" name="version" value="2026-10-21T03:00:00.000Z"/>',
    );
  });

  it("shows no score while the tahap has no assessed student", () => {
    const html = section({ scores: [null, null, null, null] });

    expect(html).toContain("Penjabaran MEDALI tahap penanaman");
    expect(html).not.toContain("Rerata tahap");
    expect(html).not.toMatch(/_emas_|_perak_|_perunggu_|_bina_/);
  });
});
