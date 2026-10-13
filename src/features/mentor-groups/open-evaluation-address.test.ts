import { describe, expect, it } from "vitest";
import type { AccountForAccess } from "@/auth/access";
import { ROLE_IDS, type RoleId } from "@/auth/role-ids";
import { evaluationAddress } from "./evaluation-address";
import { openEvaluationAddress } from "./open-evaluation-address";

const GROUP_ID = "0b4f6c1e-6f0e-4f55-9d0a-0d3c1e2f4a01";

function account(roles: RoleId[]): AccountForAccess {
  return { id: "account-1", roles, studyProgramId: 7, studentId: null };
}

describe("openEvaluationAddress", () => {
  it("gives Kepala Unit the form with the group chosen", () => {
    expect(openEvaluationAddress(account(["head_of_unit"]), GROUP_ID)).toBe(
      evaluationAddress(GROUP_ID),
    );
  });

  it("gives every other role no button, Pegawai UPK and Direktur among them", () => {
    const others = ROLE_IDS.filter((role) => role !== "head_of_unit");
    expect(others).toContain("upk_staff");
    expect(others).toContain("director");
    for (const role of others) {
      expect(openEvaluationAddress(account([role]), GROUP_ID)).toBeNull();
    }
  });
});
