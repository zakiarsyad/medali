import { describe, expect, it } from "vitest";
import { dormOf, isDormSemester, type ResidentFacts } from "./resident-rule";

const WOMAN: ResidentFacts = {
  status: "active",
  entryPath: "regular",
  sex: "female",
  isInternational: false,
  isSeedling: false,
};
const MAN: ResidentFacts = { ...WOMAN, sex: "male" };

describe("isDormSemester", () => {
  it.each([1, 2])("counts semester %i as a dorm semester", (semester) => {
    expect(isDormSemester(semester)).toBe(true);
  });

  it.each([3, 4, 8])("does not count semester %i", (semester) => {
    expect(isDormSemester(semester)).toBe(false);
  });

  it("does not count a semester that is not known", () => {
    expect(isDormSemester(null)).toBe(false);
  });
});

describe("dormOf", () => {
  it.each([1, 2])(
    "puts a Reguler woman of semester %i in Dana Rakca",
    (semester) => {
      expect(dormOf(WOMAN, semester)).toBe("dana_rakca");
    },
  );

  it.each([1, 2])(
    "puts a Reguler man of semester %i in Cipta Bakti",
    (semester) => {
      expect(dormOf(MAN, semester)).toBe("cipta_bakti");
    },
  );

  it("gives no dorm to a Reguler student from semester 3 on", () => {
    expect(dormOf(WOMAN, 3)).toBeNull();
    expect(dormOf(MAN, 8)).toBeNull();
  });

  it("gives no dorm to an Alih program student of semester 1", () => {
    expect(dormOf({ ...WOMAN, entryPath: "transfer" }, 1)).toBeNull();
    expect(dormOf({ ...MAN, entryPath: "transfer" }, 2)).toBeNull();
  });

  it.each([1, 5, 8])(
    "puts Internasional students of semester %i in Wismantara",
    (semester) => {
      const international = { isInternational: true };
      expect(dormOf({ ...MAN, ...international }, semester)).toBe(
        "wismantara_putra",
      );
      expect(dormOf({ ...WOMAN, ...international }, semester)).toBe(
        "wismantara_putri",
      );
    },
  );

  it.each([1, 5, 8])(
    "puts Pembibitan students of semester %i in Wismantara",
    (semester) => {
      const seedling = { isSeedling: true };
      expect(dormOf({ ...MAN, ...seedling }, semester)).toBe(
        "wismantara_putra",
      );
      expect(dormOf({ ...WOMAN, ...seedling }, semester)).toBe(
        "wismantara_putri",
      );
    },
  );

  it("puts an Internasional student on the Alih program jalur in Wismantara", () => {
    const student: ResidentFacts = {
      ...MAN,
      entryPath: "transfer",
      isInternational: true,
    };
    expect(dormOf(student, 4)).toBe("wismantara_putra");
  });

  it("keeps a Pembibitan student in Wismantara when no period runs", () => {
    expect(dormOf({ ...WOMAN, isSeedling: true }, null)).toBe(
      "wismantara_putri",
    );
  });

  it("gives no dorm to a Reguler student when no period runs", () => {
    expect(dormOf(WOMAN, null)).toBeNull();
  });

  it.each(["on_leave", "inactive"] as const)(
    "gives no dorm to a student whose status is %s",
    (status) => {
      expect(dormOf({ ...WOMAN, status }, 1)).toBeNull();
      expect(dormOf({ ...MAN, status, isInternational: true }, 1)).toBeNull();
      expect(dormOf({ ...WOMAN, status, isSeedling: true }, 2)).toBeNull();
    },
  );
});
