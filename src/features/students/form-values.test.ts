import { describe, expect, it } from "vitest";
import {
  formShows,
  formValues,
  refusedForm,
  START,
  savedForm,
} from "./form-values";
import type { StudentFields, StudentInput } from "./student-input";

const first = { studyProgramId: "3", cohortYear: "2026" };

const student: StudentInput = {
  nim: "9900000601",
  name: "Mahasiswa Contoh",
  email: "mahasiswa.contoh@kampus.example",
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
  email: "ma@",
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
      email: "",
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
      email: "mahasiswa.contoh@kampus.example",
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

  it("leaves the address empty for a student who has none", () => {
    expect(formValues({ ...student, email: null }, first).email).toBe("");
  });
});

describe("formShows", () => {
  const start = formValues(null, first);

  it("shows what was typed in a refused form, Jalur included", () => {
    const refused = refusedForm(START, "Nama wajib diisi.", typed);
    expect(formShows(refused, start)).toEqual(typed);
    expect(formShows(refused, start).entryPath).toBe("transfer");
  });

  it("goes back to the start before a send and after a saved one", () => {
    const refused = refusedForm(START, "Nama wajib diisi.", typed);
    const saved = savedForm(refused, "Contoh ditambahkan sebagai mahasiswa.");
    expect(formShows(START, start)).toEqual(start);
    expect(formShows(saved, start)).toEqual(start);
    expect(formShows(saved, start).entryPath).toBe("regular");
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
