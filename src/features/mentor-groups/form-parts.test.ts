import { describe, expect, it } from "vitest";
import type { AccountForAccess, RowLimit } from "@/auth/access";
import { ROLE_IDS, type RoleId } from "@/auth/role-ids";
import { formLimitsFor, openPart } from "./form-parts";

const EVERY_ROW: RowLimit = { kind: "all" };

function account(roles: RoleId[]): AccountForAccess {
  return { id: "account-1", roles, studyProgramId: 7, studentId: null };
}

describe("formLimitsFor", () => {
  it("gives Kepala Unit both forms, for every group", () => {
    expect(formLimitsFor(account(["head_of_unit"]))).toEqual({
      evaluation: EVERY_ROW,
      replacement: EVERY_ROW,
    });
  });

  it("gives every other role no form, whichever one the address asks for: the roles that read the tab among them", () => {
    const others = ROLE_IDS.filter((role) => role !== "head_of_unit");
    for (const reader of ["director", "upk_staff", "head_of_program"]) {
      expect(others).toContain(reader);
    }
    for (const role of others) {
      const limits = formLimitsFor(account([role]));

      expect(openPart("evaluation", limits)).toBeNull();
      expect(openPart("replacement", limits)).toBeNull();
    }
  });
});

describe("openPart", () => {
  it("opens the form asked for when the account may use it", () => {
    const both = { evaluation: EVERY_ROW, replacement: EVERY_ROW };

    expect(openPart("replacement", both)).toBe("replacement");
    expect(openPart("evaluation", both)).toBe("evaluation");
  });

  it("opens the other form when the one asked for is not for the account", () => {
    const onlyEvaluates = { evaluation: EVERY_ROW, replacement: null };
    const onlyReplaces = { evaluation: null, replacement: EVERY_ROW };

    expect(openPart("replacement", onlyEvaluates)).toBe("evaluation");
    expect(openPart("evaluation", onlyReplaces)).toBe("replacement");
  });

  it("opens no form for an account that only reads", () => {
    const reads = { evaluation: null, replacement: null };

    expect(openPart("replacement", reads)).toBeNull();
  });
});
