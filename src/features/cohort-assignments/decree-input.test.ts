import { describe, expect, it } from "vitest";
import {
  ASK_FOR_DAY,
  ASK_FOR_NUMBER,
  DECREE_NUMBER_MAX,
  decreeStepOf,
  parseDecree,
  wholeDecree,
} from "./decree-input";
import { NOT_UNDERSTOOD } from "./refusals";

const SENT = {
  cohortYear: "2026",
  version: "3",
  decreeNumber: "  KEP-12/UJI/2026 ",
  effectiveOn: "2026-09-01",
};

describe("parseDecree", () => {
  it("takes the number without the blanks around it, and the day", () => {
    expect(parseDecree(SENT)).toEqual({
      ok: true,
      value: {
        cohortYear: 2026,
        version: 3,
        decreeNumber: "KEP-12/UJI/2026",
        effectiveOn: "2026-09-01",
      },
    });
  });

  it("takes both fields empty, as not filled yet", () => {
    const parsed = parseDecree({ ...SENT, decreeNumber: " ", effectiveOn: "" });

    expect(parsed).toMatchObject({
      ok: true,
      value: { decreeNumber: null, effectiveOn: null },
    });
  });

  it("refuses a number that is too long", () => {
    const decreeNumber = "K".repeat(DECREE_NUMBER_MAX + 1);

    expect(parseDecree({ ...SENT, decreeNumber }).ok).toBe(false);
  });

  it.each(["1 Sep 2026", "2026-02-30", "1999-12-31", "2102-01-01"])(
    "refuses the day '%s'",
    (effectiveOn) => {
      expect(parseDecree({ ...SENT, effectiveOn }).ok).toBe(false);
    },
  );

  it("refuses a form that names no draft", () => {
    expect(parseDecree({ ...SENT, version: "" })).toEqual(NOT_UNDERSTOOD);
    expect(parseDecree({ ...SENT, cohortYear: "x" })).toEqual(NOT_UNDERSTOOD);
  });
});

describe("decreeStepOf", () => {
  it("takes the three steps of the form, and nothing else", () => {
    expect(decreeStepOf("save")).toBe("save");
    expect(decreeStepOf("submit")).toBe("submit");
    expect(decreeStepOf("fix")).toBe("fix");
    expect(decreeStepOf("cancel")).toBe(null);
    expect(decreeStepOf("")).toBe(null);
  });
});

describe("wholeDecree", () => {
  const WHOLE = { decreeNumber: "KEP-12/UJI/2026", effectiveOn: "2026-09-01" };

  it("gives the decree when the number and the day are filled", () => {
    expect(wholeDecree(WHOLE)).toEqual({ ok: true, value: WHOLE });
  });

  it.each([null, "", "   "])("asks for the number when it is '%s'", (sent) => {
    expect(wholeDecree({ ...WHOLE, decreeNumber: sent })).toEqual({
      ok: false,
      error: ASK_FOR_NUMBER,
    });
  });

  it.each([null, ""])("asks for the day when it is '%s'", (sent) => {
    expect(wholeDecree({ ...WHOLE, effectiveOn: sent })).toEqual({
      ok: false,
      error: ASK_FOR_DAY,
    });
  });
});
