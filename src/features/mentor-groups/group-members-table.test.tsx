import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { GroupMember } from "./group-detail";
import { GroupMembersTable } from "./group-members-table";
import type { MemberScores } from "./score-averages";

vi.mock("next/navigation", () => ({ useRouter: () => ({}) }));

const MEMBER: GroupMember = {
  id: "00000000-0000-4000-8000-000000000002",
  nim: "9900019101",
  name: "Anggota Uji Ani",
  className: "3-02",
  cohortYear: 2024,
  status: "active",
  opensDetail: true,
};

const CLOSED_MEMBER: GroupMember = {
  ...MEMBER,
  id: "00000000-0000-4000-8000-000000000003",
  name: "Anggota Uji Budi",
  opensDetail: false,
};

const NO_SCORES = new Map<string, MemberScores>();

const LOW = { M: 60, E: 62, D: 64, A: 60, L: 62, I: 64 };
const SILVER = { M: 80, E: 78, D: 84, A: 72, L: 82, I: 86 };

const NOT_ASSESSED_MEMBER: GroupMember = {
  ...MEMBER,
  id: "00000000-0000-4000-8000-000000000004",
  name: "Anggota Uji Citra",
};

const LOW_MEMBER: GroupMember = {
  ...MEMBER,
  id: "00000000-0000-4000-8000-000000000005",
  name: "Anggota Uji Dewi",
};

const SCORED = new Map<string, MemberScores>([
  [MEMBER.id, { latest: SILVER, earlier: null }],
  [LOW_MEMBER.id, { latest: LOW, earlier: null }],
]);

function scoredTable(): string {
  return renderToStaticMarkup(
    <GroupMembersTable
      members={[NOT_ASSESSED_MEMBER, MEMBER, LOW_MEMBER]}
      period={null}
      scores={SCORED}
      detailAddressOf={null}
    />,
  );
}

describe("GroupMembersTable", () => {
  it("shows the six MEDALI values, Rerata and the predikat of each member", () => {
    const table = scoredTable();

    expect(table).toContain('<abbr title="Mandiri">M</abbr>');
    expect(table).toContain('<td data-title="Integritas">86</td>');
    expect(table).toMatch(/data-title="Rerata">80,3</);
    expect(table).toContain("Perak");
  });

  it("says Belum diasesmen for a member not assessed", () => {
    expect(scoredTable()).toContain("Belum diasesmen");
  });

  it("puts the lowest Rerata first and the members not assessed last", () => {
    const table = scoredTable();

    const low = table.indexOf("Anggota Uji Dewi");
    const silver = table.indexOf("Anggota Uji Ani");
    const none = table.indexOf("Anggota Uji Citra");
    expect(low).toBeLessThan(silver);
    expect(silver).toBeLessThan(none);
  });

  it("carries the title of each new column in its cells, for the cards of a phone", () => {
    const table = scoredTable();

    for (const name of ["Mandiri", "Adaptif", "Rerata", "Predikat"]) {
      expect(table).toContain(`data-title="${name}"`);
    }
  });

  it("shows a member as plain words to an account that may not open the detail", () => {
    const table = renderToStaticMarkup(
      <GroupMembersTable
        members={[MEMBER]}
        period={null}
        scores={NO_SCORES}
        detailAddressOf={null}
      />,
    );

    expect(table).toContain("Anggota Uji Ani");
    expect(table).not.toContain("<a ");
  });

  it("links a member to the detail for an account that may open it", () => {
    const table = renderToStaticMarkup(
      <GroupMembersTable
        members={[MEMBER]}
        period={null}
        scores={NO_SCORES}
        detailAddressOf={(studentId) => `/uji?profil=${studentId}`}
      />,
    );

    expect(table).toContain(`href="/uji?profil=${MEMBER.id}"`);
  });

  it("has no Kelompok column on the page of one group", () => {
    const table = renderToStaticMarkup(
      <GroupMembersTable
        members={[MEMBER]}
        period={null}
        scores={NO_SCORES}
        detailAddressOf={null}
      />,
    );

    expect(table).not.toContain("Kelompok");
  });

  it("shows the group of each member when the list holds more than one group", () => {
    const table = renderToStaticMarkup(
      <GroupMembersTable
        members={[MEMBER]}
        period={null}
        scores={NO_SCORES}
        detailAddressOf={null}
        groupOf={() => "KP 24-UJI-01"}
      />,
    );

    expect(table).toContain("<th>Kelompok</th>");
    expect(table).toContain('<td data-title="Kelompok">KP 24-UJI-01</td>');
  });

  it("links only the members whose detail the account may open", () => {
    const table = renderToStaticMarkup(
      <GroupMembersTable
        members={[MEMBER, CLOSED_MEMBER]}
        period={null}
        scores={NO_SCORES}
        detailAddressOf={(studentId) => `/uji?profil=${studentId}`}
      />,
    );

    expect(table).toContain(`href="/uji?profil=${MEMBER.id}"`);
    expect(table).toContain("Anggota Uji Budi");
    expect(table).not.toContain(CLOSED_MEMBER.id);
  });
});
