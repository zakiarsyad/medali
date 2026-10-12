import { describe, expect, it } from "vitest";
import { type AccountForAccess, may, type RowLimit } from "@/auth/access";
import { ROLE_IDS, type RoleId } from "@/auth/role-ids";
import { mentorRowsFor } from "./visible-mentors";

function account(
  roles: RoleId[],
  studyProgramId: number | null = null,
): AccountForAccess {
  return { id: "account-1", roles, studyProgramId, studentId: null };
}

describe("mentorRowsFor", () => {
  it.each(["head_of_unit", "director", "upk_staff"] as const)(
    "gives %s every mentor",
    (role) => {
      expect(mentorRowsFor(account([role]))).toEqual({ kind: "all" });
    },
  );

  it("gives Ketua Program Studi the mentors of their program", () => {
    const limit: RowLimit = {
      kind: "some",
      studyProgramIds: [7],
      menteesOf: [],
      studentIds: [],
    };

    expect(mentorRowsFor(account(["head_of_program"], 7))).toEqual(limit);
  });

  it("gives a Ketua Program Studi with no study program no program at all", () => {
    expect(mentorRowsFor(account(["head_of_program"]))).toMatchObject({
      kind: "some",
      studyProgramIds: [],
    });
  });

  it.each(["mentor", "student"] as const)(
    "refuses %s, who asks for mentors by hand",
    (role) => {
      const asking = { ...account([role], 7), studentId: "student-1" };

      expect(mentorRowsFor(asking)).toBeNull();
    },
  );

  it("refuses every role without the right, also one that sees every student row", () => {
    const others = ROLE_IDS.filter((role) => !may([role], "view_mentors"));

    expect(others).toContain("dorm_manager");
    for (const role of others) {
      expect(mentorRowsFor(account([role], 7))).toBeNull();
    }
  });

  it("gives a mentor who is also Pegawai UPK every mentor", () => {
    expect(mentorRowsFor(account(["mentor", "upk_staff"]))).toEqual({
      kind: "all",
    });
  });
});
