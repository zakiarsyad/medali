import { describe, expect, it } from "vitest";
import { type AccountForAccess, may, type RowLimit } from "@/auth/access";
import { ROLE_IDS, type RoleId } from "@/auth/role-ids";
import { groupRowsFor, maySeeGroup } from "./visible-groups";

function onlyPrograms(studyProgramIds: number[]): RowLimit {
  return { kind: "some", studyProgramIds, menteesOf: [], studentIds: [] };
}

function account(
  roles: RoleId[],
  studyProgramId: number | null = null,
): AccountForAccess {
  return { id: "account-1", roles, studyProgramId, studentId: null };
}

describe("maySeeGroup", () => {
  it("shows every group to an account that sees every row", () => {
    expect(maySeeGroup({ kind: "all" }, 7)).toBe(true);
  });

  it("shows a head of a study program the groups of that program", () => {
    expect(maySeeGroup(onlyPrograms([7]), 7)).toBe(true);
  });

  it("refuses a head of a study program the group of another program", () => {
    expect(maySeeGroup(onlyPrograms([7]), 8)).toBe(false);
  });

  it("refuses every group to an account with no study program", () => {
    expect(maySeeGroup(onlyPrograms([]), 7)).toBe(false);
  });

  it("opens no group through the mentees or the student of an account", () => {
    const limit: RowLimit = {
      kind: "some",
      studyProgramIds: [],
      menteesOf: ["account-1"],
      studentIds: ["student-1"],
    };
    expect(maySeeGroup(limit, 7)).toBe(false);
  });
});

describe("groupRowsFor", () => {
  it.each(["head_of_unit", "director", "upk_staff"] as const)(
    "gives %s every group",
    (role) => {
      expect(groupRowsFor(account([role]))).toEqual({ kind: "all" });
    },
  );

  it("gives Ketua Program Studi the groups of their program", () => {
    expect(groupRowsFor(account(["head_of_program"], 7))).toEqual(
      onlyPrograms([7]),
    );
  });

  it.each(["mentor", "student"] as const)(
    "refuses %s, who asks for groups by hand",
    (role) => {
      const asking = { ...account([role], 7), studentId: "student-1" };

      expect(groupRowsFor(asking)).toBeNull();
    },
  );

  it("refuses every role without the right, also one that sees every student row", () => {
    const others = ROLE_IDS.filter(
      (role) => !may([role], "view_mentor_groups"),
    );

    expect(others).toContain("dorm_manager");
    for (const role of others) {
      expect(groupRowsFor(account([role], 7))).toBeNull();
    }
  });

  it("gives a mentor who is also Pegawai UPK every group", () => {
    expect(groupRowsFor(account(["mentor", "upk_staff"]))).toEqual({
      kind: "all",
    });
  });
});
