import { describe, expect, it } from "vitest";
import type { RoleId } from "./role-ids";
import { workingRoles } from "./working-roles";

const HELD: RoleId[] = ["student", "bam_bphk", "bam_health"];
const ACTIVE = { status: "active", deletedAt: null } as const;

describe("workingRoles", () => {
  it("keeps every role of an Aktif student", () => {
    expect(workingRoles(HELD, ACTIVE)).toEqual(HELD);
  });

  it.each(["on_leave", "inactive"] as const)(
    "drops the BAM roles of a student who is %s, and keeps Mahasiswa",
    (status) => {
      expect(workingRoles(HELD, { status, deletedAt: null })).toEqual([
        "student",
      ]);
    },
  );

  it("drops the BAM roles of a removed student", () => {
    const removed = { status: "active", deletedAt: new Date() } as const;
    expect(workingRoles(HELD, removed)).toEqual(["student"]);
  });

  it("leaves the roles of an account that is not a student's alone", () => {
    const staff: RoleId[] = ["mentor", "bam_bphk"];
    expect(workingRoles(staff, null)).toEqual(staff);
  });

  it("drops only BAM roles, whatever else the student's account holds", () => {
    const roles: RoleId[] = ["mentor", "student", "bam_catering"];
    expect(
      workingRoles(roles, { status: "inactive", deletedAt: null }),
    ).toEqual(["mentor", "student"]);
  });
});
