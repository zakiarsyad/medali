import { describe, expect, it } from "vitest";
import { BAM_ROLES, isBamRole } from "./bam-roles";
import { ROLE_IDS } from "./role-ids";

describe("BAM_ROLES", () => {
  it("holds the seven roles of Badan Asrama Mahasiswa, in role order", () => {
    expect(BAM_ROLES).toEqual(
      ROLE_IDS.filter((role) => role.startsWith("bam_")),
    );
    expect(BAM_ROLES).toHaveLength(7);
  });
});

describe("isBamRole", () => {
  it.each(["bam_bphk", "bam_health"])("takes %s", (role) => {
    expect(isBamRole(role)).toBe(true);
  });

  it.each([
    "student",
    "mentor",
    "dorm_manager",
    "head_of_unit",
    "bam_unknown",
    "",
  ])("refuses '%s'", (role) => {
    expect(isBamRole(role)).toBe(false);
  });
});
