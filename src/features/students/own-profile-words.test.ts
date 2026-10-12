// Sample NIMs of this file: 9900002300 to 9900002399. None is added to
// the database.
import { describe, expect, it } from "vitest";
import { ownProfileLine } from "./own-profile-words";

const STUDENT = { nim: "9900002301", studyProgram: "D-IV Akuntansi" };

describe("ownProfileLine", () => {
  it("says the NIM, the program studi, the semester and its tahap in small letters", () => {
    expect(ownProfileLine({ ...STUDENT, status: "active" }, 3)).toBe(
      "9900002301 · D-IV Akuntansi · Semester 3, tahap penumbuhan",
    );
    expect(ownProfileLine({ ...STUDENT, status: "active" }, 8)).toBe(
      "9900002301 · D-IV Akuntansi · Semester 8, tahap pematangan",
    );
  });

  it("says a student on Cuti is not active, whatever their semester", () => {
    expect(ownProfileLine({ ...STUDENT, status: "on_leave" }, 3)).toBe(
      "9900002301 · D-IV Akuntansi · Tidak aktif",
    );
    expect(ownProfileLine({ ...STUDENT, status: "on_leave" }, null)).toBe(
      "9900002301 · D-IV Akuntansi · Tidak aktif",
    );
  });

  it("says a Non aktif student is not active", () => {
    expect(ownProfileLine({ ...STUDENT, status: "inactive" }, null)).toBe(
      "9900002301 · D-IV Akuntansi · Tidak aktif",
    );
  });

  it("leaves the semester out for an Aktif student while no period runs", () => {
    expect(ownProfileLine({ ...STUDENT, status: "active" }, null)).toBe(
      "9900002301 · D-IV Akuntansi",
    );
  });
});
