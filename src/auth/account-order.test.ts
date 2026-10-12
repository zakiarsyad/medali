import { describe, expect, it } from "vitest";
import { staffThenStudents } from "./account-order";
import type { Account } from "./accounts";
import type { RoleId } from "./role-ids";

function account(name: string, roles: RoleId[]): Account {
  return {
    id: name,
    name,
    title: null,
    unit: null,
    roles,
    studyProgramId: null,
    studentId: null,
    studentProgram: null,
  };
}

function namesInOrder(accounts: Account[]): string[] {
  return staffThenStudents(accounts).map((found) => found.name);
}

describe("staffThenStudents", () => {
  it("puts every staff account before the first student account", () => {
    const names = namesInOrder([
      account("Mahasiswa", ["student"]),
      account("Penilai", ["assessor"]),
      account("Pengasuh", ["mentor"]),
      account("Pengelola Asrama", ["dorm_manager"]),
    ]);
    expect(names).toEqual([
      "Pengasuh",
      "Pengelola Asrama",
      "Penilai",
      "Mahasiswa",
    ]);
  });

  it("lists staff accounts in role order, not by name", () => {
    const names = namesInOrder([
      account("Agus", ["assessor"]),
      account("Bambang", ["director"]),
      account("Ratna", ["head_of_unit"]),
    ]);
    expect(names).toEqual(["Ratna", "Bambang", "Agus"]);
  });

  it("puts an account with two roles at its first role", () => {
    const names = namesInOrder([
      account("Konselor", ["counsellor"]),
      account("Dua Peran", ["upk_staff", "counsellor"]),
      account("Petugas Disiplin", ["discipline_officer"]),
      account("Pengelola Asrama", ["dorm_manager"]),
    ]);
    expect(names).toEqual([
      "Pengelola Asrama",
      "Dua Peran",
      "Konselor",
      "Petugas Disiplin",
    ]);
  });

  it("sorts staff accounts with the same first role by name", () => {
    const names = namesInOrder([
      account("Yusuf", ["upk_staff", "counsellor"]),
      account("Sri", ["upk_staff"]),
    ]);
    expect(names).toEqual(["Sri", "Yusuf"]);
  });

  it("sorts student accounts by name", () => {
    const names = namesInOrder([
      account("Citra", ["student"]),
      account("Ayu", ["student"]),
      account("Bima", ["student"]),
    ]);
    expect(names).toEqual(["Ayu", "Bima", "Citra"]);
  });

  it("keeps a student with a BAM role among the students, by name", () => {
    const names = namesInOrder([
      account("Citra", ["student"]),
      account("Bima", ["student", "bam_health"]),
      account("Ayu", ["student"]),
      account("BAM Kesehatan", ["bam_health"]),
    ]);
    expect(names).toEqual(["BAM Kesehatan", "Ayu", "Bima", "Citra"]);
  });

  it("puts an account with no working role at the end of the staff accounts", () => {
    const names = namesInOrder([
      account("Mahasiswa", ["student"]),
      account("Tanpa Peran", []),
      account("Penilai", ["assessor"]),
    ]);
    expect(names).toEqual(["Penilai", "Tanpa Peran", "Mahasiswa"]);
  });
});
