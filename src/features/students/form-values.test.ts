// Sample NIMs of this file: 9900001800 to 9900001899.
import { describe, expect, it } from "vitest";
import {
  formShows,
  formValues,
  refusedForm,
  START,
  type StudentFormFields,
  savedForm,
} from "./form-values";
import type { StoredStudent } from "./student-input";

const first = { studyProgramId: "3", cohortYear: "2026" };
const GROUP_ID = "00000000-0000-4000-8000-000000000018";

const student: StoredStudent = {
  nim: "9900001801",
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
  mentorGroupId: GROUP_ID,
};

const typed: StudentFormFields = {
  nim: "99000018",
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
  mentorGroupId: GROUP_ID,
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
      mentorGroupId: "",
    });
  });

  it("fills the form with the student being changed", () => {
    expect(formValues(student, first)).toEqual({
      nim: "9900001801",
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
      mentorGroupId: GROUP_ID,
    });
  });

  it("leaves the address empty for a student who has none", () => {
    expect(formValues({ ...student, email: null }, first).email).toBe("");
  });

  it("stands on Belum ditetapkan for a student who is in no group", () => {
    const inNone = formValues({ ...student, mentorGroupId: null }, first);

    expect(inNone.mentorGroupId).toBe("");
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
