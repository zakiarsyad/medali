import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { ListedGroup } from "./group-list";
import { GroupListTable } from "./group-list-table";
import type { LastEvaluations } from "./last-evaluations";
import type { Reratas } from "./medali-averages";

vi.mock("next/navigation", () => ({ useRouter: () => ({}) }));

const GROUP: ListedGroup = {
  id: "00000000-0000-4000-8000-000000000001",
  cohortYear: 2024,
  entryPath: "regular",
  number: 1,
  programCode: "UJI",
  studyProgram: "Prodi Uji",
  mentorName: "Pengasuh Uji Ani",
  mentorSince: "2024-09-01",
  members: 30,
  mentorLines: 1,
};

const GOOD = { activity: 90, attendance: 85, achievement: 80, feedback: 88 };

function shown(
  lastEvaluations: LastEvaluations | null,
  reratas: Reratas = new Map(),
): string {
  return renderToStaticMarkup(
    <GroupListTable
      groups={[GROUP]}
      lastEvaluations={lastEvaluations}
      reratas={reratas}
    />,
  );
}

describe("GroupListTable", () => {
  it("shows Evaluasi terakhir with the result and its average", () => {
    const table = shown(new Map([[GROUP.id, GOOD]]));

    expect(table).toContain("<th>Evaluasi terakhir</th>");
    expect(table).toContain('data-title="Evaluasi terakhir"');
    expect(table).toContain("Baik · 85,8");
  });

  it("says so for a group that has no evaluation", () => {
    expect(shown(new Map())).toContain("Belum dievaluasi");
  });

  it("shows no Evaluasi terakhir to an account that may not see evaluations", () => {
    const table = shown(null);

    expect(table).not.toContain("Evaluasi terakhir");
    expect(table).not.toContain("Belum dievaluasi");
    expect(table).toContain("KP 24-UJI-01");
  });

  it("shows Rerata MEDALI to one decimal", () => {
    const table = shown(null, new Map([[GROUP.id, 75]]));

    expect(table).toContain("<th>Rerata MEDALI</th>");
    expect(table).toContain('<td data-title="Rerata MEDALI">75,0</td>');
  });

  it("shows a dash as Rerata MEDALI when nobody is assessed", () => {
    expect(shown(null)).toContain('<td data-title="Rerata MEDALI">-</td>');
  });
});
