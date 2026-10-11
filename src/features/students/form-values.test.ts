import { describe, expect, it } from "vitest";
import { formValues, refusedForm, START, savedForm } from "./form-values";
import type { StudentFields, StudentInput } from "./student-input";

const first = { studyProgramId: "3", cohortYear: "2026" };

const student: StudentInput = {
  nim: "9900000601",
  name: "Mahasiswa Contoh",
  studyProgramId: 7,
  entryPath: "transfer",
  sex: "female",
  cohortYear: 2025,
  className: null,
  province: "Bali",
  originAgency: null,
  status: "on_leave",
  isAffirmation: true,
  isSeedling: false,
  isInternational: false,
  isBlended: true,
};

const typed: StudentFields = {
  nim: "99000006",
  name: "Ma",
  studyProgramId: "7",
  entryPath: "transfer",
  sex: "female",
  cohortYear: "2024",
  className: "1-01",
  province: "Riau",
  originAgency: "",
  status: "active",
  categories: ["isSeedling"],
};

describe("formValues", () => {
  it("starts a new student with the first choices and nothing typed", () => {
    expect(formValues(null, first)).toEqual({
      nim: "",
      name: "",
      studyProgramId: "3",
      entryPath: "regular",
      sex: "male",
      cohortYear: "2026",
      className: "",
      province: "",
      originAgency: "",
      status: "active",
      categories: [],
    });
  });

  it("fills the form with the student being changed", () => {
    expect(formValues(student, first)).toEqual({
      nim: "9900000601",
      name: "Mahasiswa Contoh",
      studyProgramId: "7",
      entryPath: "transfer",
      sex: "female",
      cohortYear: "2025",
      className: "",
      province: "Bali",
      originAgency: "",
      status: "on_leave",
      categories: ["isAffirmation", "isBlended"],
    });
  });
});

describe("refusedForm", () => {
  it("keeps what was typed, with the reason", () => {
    expect(refusedForm(START, "NIM harus 10 digit angka.", typed)).toEqual({
      error: "NIM harus 10 digit angka.",
      done: null,
      values: typed,
      attempt: 1,
    });
  });
});

describe("savedForm", () => {
  it("lets go of what was typed, with the confirmation", () => {
    const refused = refusedForm(START, "Nama wajib diisi.", typed);
    expect(savedForm(refused, "Contoh ditambahkan sebagai mahasiswa.")).toEqual(
      {
        error: null,
        done: "Contoh ditambahkan sebagai mahasiswa.",
        values: null,
        attempt: 2,
      },
    );
  });
});
