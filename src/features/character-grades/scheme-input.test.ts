import { describe, expect, it } from "vitest";
import {
  LIMITS_NOT_DOWN,
  maySave,
  NO_PASS_LETTER,
  NOT_WHOLE,
  parseScheme,
  type SentScheme,
  schemeFaults,
  TOTAL_NOT_100,
} from "./scheme-input";

const STARTING_SENT: SentScheme = {
  weights: { attendance: "25", mentoring: "25", siku: "25", skpm: "25" },
  lowerLimits: { A: "85", B: "70", C: "60", D: "50" },
  passLetter: "B",
};

function sent(more: {
  weights?: Partial<SentScheme["weights"]>;
  lowerLimits?: Partial<SentScheme["lowerLimits"]>;
  passLetter?: string;
}): SentScheme {
  return {
    weights: { ...STARTING_SENT.weights, ...more.weights },
    lowerLimits: { ...STARTING_SENT.lowerLimits, ...more.lowerLimits },
    passLetter: more.passLetter ?? STARTING_SENT.passLetter,
  };
}

describe("parseScheme", () => {
  it("takes the starting scheme", () => {
    expect(parseScheme(STARTING_SENT)).toEqual({
      ok: true,
      value: {
        weights: { attendance: 25, mentoring: 25, siku: 25, skpm: 25 },
        lowerLimits: { A: 85, B: 70, C: 60, D: 50 },
        passLetter: "B",
      },
    });
  });

  it("takes a weight of 0 and a limit of 0, with spaces around a number", () => {
    const parsed = parseScheme(
      sent({
        weights: { attendance: " 40 ", mentoring: "40", siku: "0", skpm: "20" },
        lowerLimits: { D: "0" },
        passLetter: "E",
      }),
    );

    expect(parsed).toEqual({
      ok: true,
      value: {
        weights: { attendance: 40, mentoring: 40, siku: 0, skpm: 20 },
        lowerLimits: { A: 85, B: 70, C: 60, D: 0 },
        passLetter: "E",
      },
    });
  });

  it.each(["", "-1", "101", "12.5", "12,5", "abc", "1e2", "007"])(
    "refuses the weight %j as not a whole number from 0 to 100",
    (typed) => {
      expect(parseScheme(sent({ weights: { siku: typed } }))).toEqual({
        ok: false,
        error: NOT_WHOLE,
      });
    },
  );

  it.each(["", "101", "7.5"])(
    "refuses the lower limit %j as not a whole number from 0 to 100",
    (typed) => {
      expect(parseScheme(sent({ lowerLimits: { C: typed } }))).toEqual({
        ok: false,
        error: NOT_WHOLE,
      });
    },
  );

  it("refuses weights that do not total 100", () => {
    expect(parseScheme(sent({ weights: { attendance: "40" } }))).toEqual({
      ok: false,
      error: TOTAL_NOT_100,
    });
  });

  it.each<[string, Partial<SentScheme["lowerLimits"]>]>([
    ["B as high as A", { B: "85" }],
    ["C above B", { C: "75" }],
    ["D as high as C", { D: "60" }],
  ])("refuses lower limits with %s", (_, lowerLimits) => {
    expect(parseScheme(sent({ lowerLimits }))).toEqual({
      ok: false,
      error: LIMITS_NOT_DOWN,
    });
  });

  it.each(["", "F", "b", "AB"])("refuses the pass letter %j", (passLetter) => {
    expect(parseScheme(sent({ passLetter }))).toEqual({
      ok: false,
      error: NO_PASS_LETTER,
    });
  });

  it("says what to do, in the prototype's words where it has them", () => {
    expect(TOTAL_NOT_100).toBe("Total bobot harus 100%.");
    expect(LIMITS_NOT_DOWN).toBe(
      "Batas bawah huruf harus menurun dari A ke D.",
    );
    expect(NOT_WHOLE).toBe("Isi bilangan bulat dari 0 sampai 100.");
  });
});

describe("schemeFaults", () => {
  it("finds nothing in the starting scheme", () => {
    expect(schemeFaults(STARTING_SENT)).toEqual({
      weights: { attendance: null, mentoring: null, siku: null, skpm: null },
      lowerLimits: { A: null, B: null, C: null, D: null },
      total: null,
      order: null,
      passLetter: null,
    });
  });

  it("names each field that is not a whole number, and leaves the total and the order to the fields", () => {
    const faults = schemeFaults(
      sent({ weights: { mentoring: "x" }, lowerLimits: { B: "200" } }),
    );

    expect(faults.weights.mentoring).toBe(NOT_WHOLE);
    expect(faults.weights.attendance).toBeNull();
    expect(faults.lowerLimits.B).toBe(NOT_WHOLE);
    expect(faults.total).toBeNull();
    expect(faults.order).toBeNull();
  });

  it("finds the total and the order at once", () => {
    const faults = schemeFaults(
      sent({ weights: { skpm: "0" }, lowerLimits: { B: "85" } }),
    );

    expect(faults.total).toBe(TOTAL_NOT_100);
    expect(faults.order).toBe(LIMITS_NOT_DOWN);
  });
});

describe("maySave", () => {
  it("lets Simpan skema be pressed for weights that total 100", () => {
    expect(maySave(STARTING_SENT)).toBe(true);
    expect(
      maySave(
        sent({
          weights: {
            attendance: "40",
            mentoring: "20",
            siku: "20",
            skpm: "20",
          },
        }),
      ),
    ).toBe(true);
  });

  it.each([
    ["90", "15"],
    ["110", "35"],
  ])(
    "switches Simpan skema off for weights that total %s, and says the total must be 100",
    (_, attendance) => {
      const typed = sent({ weights: { attendance } });

      expect(maySave(typed)).toBe(false);
      expect(schemeFaults(typed).total).toBe(TOTAL_NOT_100);
    },
  );

  it("switches Simpan skema off for any other fault, the total being 100", () => {
    expect(maySave(sent({ weights: { siku: "x" } }))).toBe(false);
    expect(maySave(sent({ lowerLimits: { B: "85" } }))).toBe(false);
    expect(maySave(sent({ passLetter: "F" }))).toBe(false);
  });
});
