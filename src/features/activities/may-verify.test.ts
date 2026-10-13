import { describe, expect, it } from "vitest";
import { ROLE_IDS, type RoleId } from "@/auth/role-ids";
import { mayVerify } from "./may-verify";

function account(roles: RoleId[]) {
  return { id: "account-1", roles, studyProgramId: 7, studentId: "student-1" };
}

describe("mayVerify", () => {
  it("lets Pegawai UPK verify attendance", () => {
    expect(mayVerify(account(["upk_staff"]))).toBe(true);
  });

  it("refuses every other role, Kepala Unit, Penilai Mahasiswa and Mahasiswa among them", () => {
    const others = ROLE_IDS.filter((role) => role !== "upk_staff");
    expect(others).toEqual(
      expect.arrayContaining(["head_of_unit", "assessor", "student"]),
    );
    for (const role of others) {
      expect(mayVerify(account([role]))).toBe(false);
    }
  });

  it("lets an account verify that is Pegawai UPK next to another role", () => {
    expect(mayVerify(account(["mentor", "upk_staff"]))).toBe(true);
  });

  it("refuses an account with no role", () => {
    expect(mayVerify(account([]))).toBe(false);
  });
});
