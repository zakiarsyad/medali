import { describe, expect, it } from "vitest";
import type { AccountForAccess, RowLimit } from "@/auth/access";
import { ROLE_IDS, type RoleId } from "@/auth/role-ids";
import { evaluatedRowsFor, evaluationRowsFor } from "./visible-evaluations";

const EVERY_ROW: RowLimit = { kind: "all" };

function onlyPrograms(studyProgramIds: number[]): RowLimit {
  return { kind: "some", studyProgramIds, menteesOf: [], studentIds: [] };
}

function account(
  roles: RoleId[],
  studyProgramId: number | null = null,
): AccountForAccess {
  return { id: "account-1", roles, studyProgramId, studentId: null };
}

describe("evaluationRowsFor", () => {
  it.each(["head_of_unit", "director", "upk_staff"] as const)(
    "gives %s the evaluations of every group",
    (role) => {
      expect(evaluationRowsFor(account([role]))).toEqual(EVERY_ROW);
    },
  );

  it("gives Ketua Program Studi the evaluations of the groups of their program", () => {
    expect(evaluationRowsFor(account(["head_of_program"], 7))).toEqual(
      onlyPrograms([7]),
    );
  });

  it("keeps Ketua Program Studi who is also Pengasuh to their program", () => {
    expect(
      evaluationRowsFor(account(["head_of_program", "mentor"], 7)),
    ).toEqual(onlyPrograms([7]));
  });

  it.each(["mentor", "student", "counsellor", "dorm_manager"] as const)(
    "refuses %s, who asks for evaluations by hand",
    (role) => {
      expect(evaluationRowsFor(account([role], 7))).toBeNull();
    },
  );
});

describe("evaluatedRowsFor", () => {
  it("lets Kepala Unit evaluate the mentor of every group", () => {
    expect(evaluatedRowsFor(account(["head_of_unit"]))).toEqual(EVERY_ROW);
  });

  it("refuses every other role, Pegawai UPK among them", () => {
    const others = ROLE_IDS.filter((role) => role !== "head_of_unit");
    expect(others).toContain("upk_staff");
    for (const role of others) {
      expect(evaluatedRowsFor(account([role], 7))).toBeNull();
    }
  });
});
