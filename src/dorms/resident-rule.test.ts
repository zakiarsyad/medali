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
      expect(dormOf(WOMAN, semester, null, null)).toBe("dana_rakca");
    },
  );

  it.each([1, 2])(
    "puts a Reguler man of semester %i in Cipta Bakti",
    (semester) => {
      expect(dormOf(MAN, semester, null, null)).toBe("cipta_bakti");
    },
  );

  it("gives no dorm to a Reguler student from semester 3 on", () => {
    expect(dormOf(WOMAN, 3, null, null)).toBeNull();
    expect(dormOf(MAN, 8, null, null)).toBeNull();
  });

  it("gives no dorm to an Alih program student of semester 1", () => {
    expect(
      dormOf({ ...WOMAN, entryPath: "transfer" }, 1, null, null),
    ).toBeNull();
    expect(dormOf({ ...MAN, entryPath: "transfer" }, 2, null, null)).toBeNull();
  });

  it.each([1, 5, 8])(
    "puts Internasional students of semester %i in Wismantara",
    (semester) => {
      const international = { isInternational: true };
      expect(dormOf({ ...MAN, ...international }, semester, null, null)).toBe(
        "wismantara_putra",
      );
      expect(dormOf({ ...WOMAN, ...international }, semester, null, null)).toBe(
        "wismantara_putri",
      );
    },
  );

  it.each([1, 5, 8])(
    "puts Pembibitan students of semester %i in Wismantara",
    (semester) => {
      const seedling = { isSeedling: true };
      expect(dormOf({ ...MAN, ...seedling }, semester, null, null)).toBe(
        "wismantara_putra",
      );
      expect(dormOf({ ...WOMAN, ...seedling }, semester, null, null)).toBe(
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
    expect(dormOf(student, 4, null, null)).toBe("wismantara_putra");
  });

  it("keeps a Pembibitan student in Wismantara when no period runs", () => {
    expect(dormOf({ ...WOMAN, isSeedling: true }, null, null, null)).toBe(
      "wismantara_putri",
    );
  });

  it("gives no dorm to a Reguler student when no period runs", () => {
    expect(dormOf(WOMAN, null, null, null)).toBeNull();
  });

  it.each(["on_leave", "inactive"] as const)(
    "gives no dorm to a student whose status is %s",
    (status) => {
      expect(dormOf({ ...WOMAN, status }, 1, null, null)).toBeNull();
      expect(
        dormOf({ ...MAN, status, isInternational: true }, 1, null, null),
      ).toBeNull();
      expect(
        dormOf({ ...WOMAN, status, isSeedling: true }, 2, null, null),
      ).toBeNull();
    },
  );

  it("puts an active kakak pendamping in the dorm they serve", () => {
    expect(
      dormOf({ ...WOMAN, entryPath: "transfer" }, 3, "dana_rakca", null),
    ).toBe("dana_rakca");
    expect(dormOf(MAN, 5, "cipta_bakti", null)).toBe("cipta_bakti");
    expect(dormOf(WOMAN, null, "dana_rakca", null)).toBe("dana_rakca");
  });

  it("puts a resident of Wismantara who is kakak pendamping in the dorm they serve only", () => {
    expect(
      dormOf({ ...WOMAN, isInternational: true }, 3, "dana_rakca", null),
    ).toBe("dana_rakca");
    expect(dormOf({ ...MAN, isSeedling: true }, 1, "cipta_bakti", null)).toBe(
      "cipta_bakti",
    );
  });

  it.each(["on_leave", "inactive"] as const)(
    "gives no dorm to a kakak pendamping whose status is %s",
    (status) => {
      expect(dormOf({ ...WOMAN, status }, 3, "dana_rakca", null)).toBeNull();
    },
  );

  it("puts a student made a resident by hand in the dorm chosen", () => {
    expect(dormOf(WOMAN, 5, null, { dorm: "dana_rakca" })).toBe("dana_rakca");
    expect(
      dormOf({ ...MAN, entryPath: "transfer" }, 1, null, {
        dorm: "wismantara_putra",
      }),
    ).toBe("wismantara_putra");
  });

  it("puts a student made Non asrama by hand in no dorm", () => {
    expect(dormOf(WOMAN, 1, null, { dorm: null })).toBeNull();
    expect(
      dormOf({ ...MAN, isInternational: true }, 3, null, { dorm: null }),
    ).toBeNull();
    expect(
      dormOf({ ...WOMAN, isSeedling: true }, 1, null, { dorm: null }),
    ).toBeNull();
  });

  it("keeps a choice made by hand in semester 3", () => {
    expect(dormOf(WOMAN, 3, null, { dorm: "dana_rakca" })).toBe("dana_rakca");
    expect(dormOf(WOMAN, 3, null, null)).toBeNull();
  });

  it("puts an active kakak pendamping in the dorm they serve before a choice made by hand", () => {
    expect(dormOf(WOMAN, 3, "dana_rakca", { dorm: null })).toBe("dana_rakca");
    expect(dormOf(WOMAN, 3, "dana_rakca", { dorm: "wismantara_putri" })).toBe(
      "dana_rakca",
    );
  });

  it.each(["on_leave", "inactive"] as const)(
    "gives no dorm to a student made a resident by hand whose status is %s",
    (status) => {
      expect(
        dormOf({ ...WOMAN, status }, 1, null, { dorm: "dana_rakca" }),
      ).toBeNull();
    },
  );
});
