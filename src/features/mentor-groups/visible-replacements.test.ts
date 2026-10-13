import { describe, expect, it } from "vitest";
import type { AccountForAccess } from "@/auth/access";
import { ROLE_IDS, type RoleId } from "@/auth/role-ids";
import { replacedRowsFor } from "./visible-replacements";

function account(roles: RoleId[]): AccountForAccess {
  return { id: "account-1", roles, studyProgramId: 7, studentId: null };
}

describe("replacedRowsFor", () => {
  it("lets Kepala Unit replace the mentor of every group", () => {
    expect(replacedRowsFor(account(["head_of_unit"]))).toEqual({ kind: "all" });
  });

  it("gives every other role no group to replace the mentor of", () => {
    const others = ROLE_IDS.filter((role) => role !== "head_of_unit");

    for (const role of others) {
      expect(replacedRowsFor(account([role]))).toBeNull();
    }
  });
});
