import { describe, expect, it } from "vitest";
import { parseNewAccount, parseRoleChange } from "./account-input";

const valid = {
  name: "Budi Contoh",
  title: "S.E.",
  nip: "198001012005011001",
  email: "Budi.Contoh@contoh.ac.id",
  roles: ["mentor"],
  studyProgramId: "",
  unit: "Unit Pembangunan Karakter",
};

describe("parseNewAccount", () => {
  it("accepts a filled form, with the email in lower case", () => {
    expect(parseNewAccount(valid)).toEqual({
      ok: true,
      value: {
        name: "Budi Contoh",
        title: "S.E.",
        nip: "198001012005011001",
        email: "budi.contoh@contoh.ac.id",
        roles: ["mentor"],
        studyProgramId: null,
        unit: "Unit Pembangunan Karakter",
      },
    });
  });

  it.each([
    ["a short name", { name: "Bu" }, "Isi nama lengkap."],
    ["no role", { roles: [] }, "Pilih minimal satu peran."],
    ["an unknown role", { roles: ["owner"] }, "Peran tidak dikenal."],
    [
      "a role not managed here",
      { roles: ["head_of_unit"] },
      "Peran tidak dikenal.",
    ],
    ["a bad email", { email: "budi" }, "Isi email kedinasan yang benar."],
    [
      "a NIP with letters",
      { nip: "1980A" },
      "NIP hanya berisi angka, paling banyak 18 digit.",
    ],
    [
      "a head of program without a program",
      { roles: ["head_of_program"] },
      "Pilih program studi untuk Ketua Program Studi.",
    ],
  ])("refuses %s", (_kind, change, error) => {
    expect(parseNewAccount({ ...valid, ...change })).toEqual({
      ok: false,
      error,
    });
  });

  it("refuses a program id too large to be one", () => {
    expect(
      parseNewAccount({
        ...valid,
        roles: ["head_of_program"],
        studyProgramId: "99999999999",
      }),
    ).toEqual({
      ok: false,
      error: "Pilih program studi untuk Ketua Program Studi.",
    });
  });

  it("keeps the program of a head of program", () => {
    const parsed = parseNewAccount({
      ...valid,
      roles: ["head_of_program", "mentor"],
      studyProgramId: "4",
    });
    expect(parsed.ok && parsed.value.studyProgramId).toBe(4);
  });

  it("drops the program of an account that is not a head of program", () => {
    const parsed = parseNewAccount({ ...valid, studyProgramId: "4" });
    expect(parsed.ok && parsed.value.studyProgramId).toBeNull();
  });
});

describe("parseRoleChange", () => {
  const change = {
    accountId: "6f1c1f8e-3b7a-4c55-9a51-2f7d3c8b9e10",
    roles: ["mentor", "assessor"],
    studyProgramId: "",
    unit: "",
  };

  it("accepts new roles", () => {
    expect(parseRoleChange(change)).toEqual({
      ok: true,
      value: {
        accountId: change.accountId,
        roles: ["mentor", "assessor"],
        studyProgramId: null,
        unit: null,
      },
    });
  });

  it("refuses an account id that is not one", () => {
    expect(parseRoleChange({ ...change, accountId: "x" })).toEqual({
      ok: false,
      error: "Akun tidak ditemukan.",
    });
  });

  it("accepts no managed role, which leaves only roles not managed here", () => {
    const parsed = parseRoleChange({ ...change, roles: [] });
    expect(parsed.ok && parsed.value.roles).toEqual([]);
  });
});
