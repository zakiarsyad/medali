import { describe, expect, it } from "vitest";
import { isClosable, periodStateOf, stateWords } from "./period-state";

const PERIOD = { startsOn: "2026-08-01", endsOn: "2027-01-31" };

const CLOSING = { closedAt: new Date("2027-02-03T02:00:00Z"), kept: 120 };

describe("periodStateOf", () => {
  it.each([
    ["2026-08-01", "running"],
    ["2026-10-22", "running"],
    ["2027-01-31", "running"],
    ["2027-02-01", "ended"],
    ["2026-07-31", "upcoming"],
  ] as const)("on %s gives %s", (today, kind) => {
    expect(periodStateOf(PERIOD, null, today).kind).toBe(kind);
  });

  it("gives Ditutup to a closed period, with its closing", () => {
    expect(periodStateOf(PERIOD, CLOSING, "2027-02-03")).toEqual({
      kind: "closed",
      ...CLOSING,
    });
  });
});

describe("isClosable", () => {
  it("lets only a period that has ended and is not closed be closed", () => {
    const closable = ["2026-07-31", "2026-10-22", "2027-02-01"].map((today) =>
      isClosable(periodStateOf(PERIOD, null, today)),
    );

    expect(closable).toEqual([false, false, true]);
    expect(isClosable(periodStateOf(PERIOD, CLOSING, "2027-02-03"))).toBe(
      false,
    );
  });
});

describe("stateWords", () => {
  it("says each state as the list shows it", () => {
    const words = ["2026-07-31", "2026-10-22", "2027-02-01"].map((today) =>
      stateWords(periodStateOf(PERIOD, null, today)),
    );

    expect(words).toEqual([
      "Belum dimulai",
      "Berjalan",
      "Selesai, belum ditutup",
    ]);
    expect(stateWords(periodStateOf(PERIOD, CLOSING, "2027-02-03"))).toBe(
      "Ditutup 3 Feb 2027 · 120 nilai ditetapkan",
    );
  });
});
