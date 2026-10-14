import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SavedGroups } from "./open-cohort";
import type { StoredAssignment } from "./stored-assignment";

const GROUP = "11111111-1111-4111-8111-111111111111";

const FIXED: StoredAssignment = {
  id: "44444444-4444-4444-8444-444444444444",
  cohortYear: 2026,
  status: "fixed",
  targetSize: 30,
  method: "by_nim",
  decreeNumber: "KEP-12/UJI/2026",
  effectiveOn: "2026-09-01",
  version: 3,
  savedBy: "Kepala Uji",
  groups: [
    {
      id: GROUP,
      studyProgramId: 1,
      programName: "D3 Pajak",
      programCode: "D3PJK",
      cohortYear: 2026,
      entryPath: "regular",
      number: 1,
      mentor: { id: "yuni", name: "Yuni Contoh", title: "M.Si." },
      members: [
        {
          id: "member",
          nim: "99001",
          name: "Anggota Uji Tetap",
          sex: "female",
          province: "Bali",
          className: "1-01",
        },
      ],
    },
  ],
  dropped: 0,
  log: [],
};

function saved(mayPrepare: boolean): string {
  return renderToStaticMarkup(
    <SavedGroups
      assignment={FIXED}
      mayPrepare={mayPrepare}
      mayFix={false}
      openGroupId={GROUP}
    />,
  );
}

describe("SavedGroups of a fixed angkatan, with a group named in the address", () => {
  it("lists the members of that group to an account that prepares", () => {
    const panel = saved(true);

    expect(panel).toContain("Anggota Uji Tetap");
    expect(panel).toContain(">Tutup</a>");
  });

  it("gives an account that only reads the counts, and neither a member name nor Anggota", () => {
    const panel = saved(false);

    expect(panel).toContain("0 putra, 1 putri");
    expect(panel).not.toContain("Anggota Uji Tetap");
    expect(panel).not.toContain("99001");
    expect(panel).not.toContain("<a ");
    expect(panel).not.toContain("Tutup");
  });
});
