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
      expect(dormOf(WOMAN, semester, null)).toBe("dana_rakca");
    },
  );

  it.each([1, 2])(
    "puts a Reguler man of semester %i in Cipta Bakti",
    (semester) => {
      expect(dormOf(MAN, semester, null)).toBe("cipta_bakti");
    },
  );

  it("gives no dorm to a Reguler student from semester 3 on", () => {
    expect(dormOf(WOMAN, 3, null)).toBeNull();
    expect(dormOf(MAN, 8, null)).toBeNull();
  });

  it("gives no dorm to an Alih program student of semester 1", () => {
    expect(dormOf({ ...WOMAN, entryPath: "transfer" }, 1, null)).toBeNull();
    expect(dormOf({ ...MAN, entryPath: "transfer" }, 2, null)).toBeNull();
  });

  it.each([1, 5, 8])(
    "puts Internasional students of semester %i in Wismantara",
    (semester) => {
      const international = { isInternational: true };
      expect(dormOf({ ...MAN, ...international }, semester, null)).toBe(
        "wismantara_putra",
      );
      expect(dormOf({ ...WOMAN, ...international }, semester, null)).toBe(
        "wismantara_putri",
      );
    },
  );

  it.each([1, 5, 8])(
    "puts Pembibitan students of semester %i in Wismantara",
    (semester) => {
      const seedling = { isSeedling: true };
      expect(dormOf({ ...MAN, ...seedling }, semester, null)).toBe(
        "wismantara_putra",
      );
      expect(dormOf({ ...WOMAN, ...seedling }, semester, null)).toBe(
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
    expect(dormOf(student, 4, null)).toBe("wismantara_putra");
  });

  it("keeps a Pembibitan student in Wismantara when no period runs", () => {
    expect(dormOf({ ...WOMAN, isSeedling: true }, null, null)).toBe(
      "wismantara_putri",
    );
  });

  it("gives no dorm to a Reguler student when no period runs", () => {
    expect(dormOf(WOMAN, null, null)).toBeNull();
  });

  it.each(["on_leave", "inactive"] as const)(
    "gives no dorm to a student whose status is %s",
    (status) => {
      expect(dormOf({ ...WOMAN, status }, 1, null)).toBeNull();
      expect(
        dormOf({ ...MAN, status, isInternational: true }, 1, null),
      ).toBeNull();
      expect(
        dormOf({ ...WOMAN, status, isSeedling: true }, 2, null),
      ).toBeNull();
    },
  );

  it("puts an active kakak pendamping in the dorm they serve", () => {
    expect(dormOf({ ...WOMAN, entryPath: "transfer" }, 3, "dana_rakca")).toBe(
      "dana_rakca",
    );
    expect(dormOf(MAN, 5, "cipta_bakti")).toBe("cipta_bakti");
    expect(dormOf(WOMAN, null, "dana_rakca")).toBe("dana_rakca");
  });

  it("puts a resident of Wismantara who is kakak pendamping in the dorm they serve only", () => {
    expect(dormOf({ ...WOMAN, isInternational: true }, 3, "dana_rakca")).toBe(
      "dana_rakca",
    );
    expect(dormOf({ ...MAN, isSeedling: true }, 1, "cipta_bakti")).toBe(
      "cipta_bakti",
    );
  });

  it.each(["on_leave", "inactive"] as const)(
    "gives no dorm to a kakak pendamping whose status is %s",
    (status) => {
      expect(dormOf({ ...WOMAN, status }, 3, "dana_rakca")).toBeNull();
    },
  );
});
