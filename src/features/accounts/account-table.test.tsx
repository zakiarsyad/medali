import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { AccountTable } from "./account-table";
import { handOverQuestion } from "./hand-over-head-button";
import type { ManagedAccount } from "./manage-accounts";

vi.mock("./actions", () => ({
  handOverHeadOfUnitAction: vi.fn(),
  removeAccountAction: vi.fn(),
}));

function staff(id: string, name: string, roles: ManagedAccount["roles"]) {
  return {
    id,
    name,
    title: null,
    nip: null,
    email: null,
    unit: null,
    roles,
    studyProgramId: null,
    studyProgram: null,
  } satisfies ManagedAccount;
}

const HEAD = staff("6f1c1f8e-3b7a-4c55-9a51-2f7d3c8b9e11", "Kepala Contoh", [
  "head_of_unit",
  "mentor",
]);
const MENTOR = staff("6f1c1f8e-3b7a-4c55-9a51-2f7d3c8b9e12", "Budi Contoh", [
  "mentor",
]);

function rowOf(table: string, name: string): string {
  const row = table.split("<tr>").find((part) => part.includes(name));
  if (!row) throw new Error(`No row for ${name}.`);
  return row;
}

describe("AccountTable", () => {
  const table = renderToStaticMarkup(
    <AccountTable
      accounts={[HEAD, MENTOR]}
      filter={{ query: "", role: null, page: 0, bamPage: 0 }}
      editing={null}
      programs={[]}
    />,
  );

  it('offers "Jadikan Kepala Unit" next to "Edit peran" on a staff account that is not Kepala Unit', () => {
    const row = rowOf(table, MENTOR.name);

    expect(row).toContain("Edit peran");
    expect(row).toContain("Jadikan Kepala Unit");
  });

  it('does not offer "Jadikan Kepala Unit" on the Kepala Unit', () => {
    expect(rowOf(table, HEAD.name)).not.toContain("Jadikan Kepala Unit");
  });
});

describe("handOverQuestion", () => {
  it("names the account and says the one asking stops being Kepala Unit", () => {
    expect(handOverQuestion("Budi Contoh")).toBe(
      "Serahkan jabatan Kepala Unit kepada Budi Contoh? Anda tidak lagi menjadi Kepala Unit.",
    );
  });
});
