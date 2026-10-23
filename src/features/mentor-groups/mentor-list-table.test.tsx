import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { groupAddress } from "./group-list-address";
import type { LastEvaluations } from "./last-evaluations";
import type { Reratas } from "./medali-averages";
import type { ListedMentor } from "./mentor-list";
import { mentorAddress } from "./mentor-list-address";
import { MentorListTable } from "./mentor-list-table";

vi.mock("next/navigation", () => ({ useRouter: () => ({}) }));

const GROUP_ID = "00000000-0000-4000-8000-000000000001";

const HOLDING: ListedMentor = {
  id: "00000000-0000-4000-8000-000000000002",
  name: "Pengasuh Uji Ani",
  title: "M.Si.",
  unit: "Unit Uji",
  status: "mentoring",
  inactiveSince: null,
  inactiveReason: null,
  students: 1234,
  groups: [
    {
      id: GROUP_ID,
      mentorId: "00000000-0000-4000-8000-000000000002",
      cohortYear: 2024,
      entryPath: "regular",
      number: 1,
      programCode: "UJI",
      members: 1234,
    },
  ],
};

const INACTIVE: ListedMentor = {
  ...HOLDING,
  id: "00000000-0000-4000-8000-000000000003",
  name: "Pengasuh Uji Budi",
  status: "inactive",
  inactiveSince: "2026-03-04",
  inactiveReason: "Akun dihapus atau peran diganti",
  students: 0,
  groups: [],
};

function shown(
  mentor: ListedMentor,
  lastEvaluations: LastEvaluations | null = null,
  reratas: Reratas = new Map(),
): string {
  return renderToStaticMarkup(
    <MentorListTable
      mentors={[mentor]}
      lastEvaluations={lastEvaluations}
      reratas={reratas}
    />,
  );
}

/** The Nilai evaluasi of 60, 60, 60 and 59. */
const POOR = 59.8;

describe("MentorListTable", () => {
  it("shows the name as a link to the mentor's page, with gelar and unit", () => {
    const table = shown(HOLDING);

    expect(table).toContain(`href="${mentorAddress(HOLDING.id)}"`);
    expect(table).toContain("M.Si. · Unit Uji");
  });

  it("shows each group as a link to the group's page, and the students", () => {
    const table = shown(HOLDING);

    expect(table).toContain(`href="${groupAddress(GROUP_ID)}"`);
    expect(table).toContain("KP 24-UJI-01");
    expect(table).toContain('<td data-title="Binaan">1.234</td>');
  });

  it("shows no reason under a status other than Tidak aktif", () => {
    expect(shown(HOLDING)).not.toContain("Akun dihapus atau peran diganti");
  });

  it("shows the reason under Tidak aktif, and a dash for no group and no student", () => {
    const table = shown(INACTIVE);

    expect(table).toContain("Tidak aktif");
    expect(table).toContain("Akun dihapus atau peran diganti");
    expect(table).toContain('<td data-title="Kelompok">-</td>');
    expect(table).toContain('<td data-title="Binaan">-</td>');
  });

  it("never shows a NIP column", () => {
    expect(shown(HOLDING)).not.toContain("NIP");
  });

  it("carries the title of each column in its cells, for the cards of a phone", () => {
    const table = shown(HOLDING);

    for (const title of [
      "Pengasuh",
      "Status",
      "Kelompok",
      "Binaan",
      "Rerata",
    ]) {
      expect(table).toContain(`<th>${title}</th>`);
      expect(table).toContain(`data-title="${title}"`);
    }
  });

  it("shows Evaluasi terakhir with the result and its average, or that there is none", () => {
    const evaluated = shown(HOLDING, new Map([[HOLDING.id, POOR]]));
    const without = shown(HOLDING, new Map());

    expect(evaluated).toContain("<th>Evaluasi terakhir</th>");
    expect(evaluated).toContain('data-title="Evaluasi terakhir"');
    expect(evaluated).toContain("Kurang · 59,8");
    expect(without).toContain("Belum dievaluasi");
  });

  it("shows no Evaluasi terakhir to an account that may not see evaluations", () => {
    const table = shown(HOLDING, null);

    expect(table).not.toContain("Evaluasi terakhir");
    expect(table).not.toContain("Belum dievaluasi");
  });

  it("shows the Rerata over the mentees to one decimal, or a dash when none is assessed", () => {
    const assessed = shown(HOLDING, null, new Map([[HOLDING.id, 80.3]]));

    expect(assessed).toContain('<td data-title="Rerata">80,3</td>');
    expect(shown(INACTIVE)).toContain('<td data-title="Rerata">-</td>');
  });
});
