import { describe, expect, it } from "vitest";
import { ROLE_IDS, type RoleId } from "@/auth/role-ids";
import { mayDecideClarifications } from "./may-decide-clarifications";

function account(roles: RoleId[]) {
  return { id: "account-1", roles, studyProgramId: 7, studentId: "student-1" };
}

describe("mayDecideClarifications", () => {
  it("lets Penilai Mahasiswa decide clarifications", () => {
    expect(mayDecideClarifications(account(["assessor"]))).toBe(true);
  });

  it("refuses every other role, Kepala Unit, Pegawai UPK and Mahasiswa among them", () => {
    const others = ROLE_IDS.filter((role) => role !== "assessor");
    expect(others).toEqual(
      expect.arrayContaining(["head_of_unit", "upk_staff", "student"]),
    );
    for (const role of others) {
      expect(mayDecideClarifications(account([role]))).toBe(false);
    }
  });

  it("lets an account decide that is Penilai Mahasiswa next to another role", () => {
    expect(mayDecideClarifications(account(["mentor", "assessor"]))).toBe(true);
  });

  it("refuses an account with no role", () => {
    expect(mayDecideClarifications(account([]))).toBe(false);
  });
});
