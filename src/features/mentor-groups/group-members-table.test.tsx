import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { GroupMember } from "./group-detail";
import { GroupMembersTable } from "./group-members-table";

vi.mock("next/navigation", () => ({ useRouter: () => ({}) }));

const MEMBER: GroupMember = {
  id: "00000000-0000-4000-8000-000000000002",
  nim: "9900019001",
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

describe("GroupMembersTable", () => {
  it("shows a member as plain words to an account that may not open the detail", () => {
    const table = renderToStaticMarkup(
      <GroupMembersTable
        members={[MEMBER]}
        period={null}
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
        detailAddressOf={(studentId) => `/uji?profil=${studentId}`}
      />,
    );

    expect(table).toContain(`href="/uji?profil=${MEMBER.id}"`);
    expect(table).toContain("Anggota Uji Budi");
    expect(table).not.toContain(CLOSED_MEMBER.id);
  });
});
