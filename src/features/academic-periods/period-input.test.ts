import { describe, expect, it } from "vitest";
import { parseNewPeriod, parsePeriodDates } from "./period-input";

const SENT = {
  year: "2026/2027",
  term: "odd",
  startsOn: "2026-08-01",
  endsOn: "2027-01-31",
};

describe("parseNewPeriod", () => {
  it("takes a year, Ganjil or Genap, and both days", () => {
    expect(parseNewPeriod(SENT)).toEqual({
      ok: true,
      value: {
        startYear: 2026,
        term: "odd",
        startsOn: "2026-08-01",
        endsOn: "2027-01-31",
      },
    });
    expect(
      parseNewPeriod({ ...SENT, year: " 2026/2027 ", term: "even" }),
    ).toMatchObject({ ok: true, value: { startYear: 2026, term: "even" } });
  });

  it.each([
    ["an empty year", ""],
    ["one year only", "2026"],
    ["two years that do not follow each other", "2026/2028"],
    ["the years the wrong way round", "2027/2026"],
    ["a year too far back", "1899/1900"],
    ["words", "tahun ini"],
  ])("refuses %s", (_what, year) => {
    expect(parseNewPeriod({ ...SENT, year })).toEqual({
      ok: false,
      error: "Tahun akademik ditulis seperti 2026/2027.",
    });
  });

  it.each(["", "ganjil", "both"])("refuses %j as Ganjil or Genap", (term) => {
    expect(parseNewPeriod({ ...SENT, term })).toEqual({
      ok: false,
      error: "Pilih Ganjil atau Genap.",
    });
  });

  it("refuses days that parsePeriodDates refuses", () => {
    expect(parseNewPeriod({ ...SENT, endsOn: "" })).toEqual(
      parsePeriodDates({ startsOn: SENT.startsOn, endsOn: "" }),
    );
  });
});

describe("parsePeriodDates", () => {
  it("takes an end after the start", () => {
    expect(
      parsePeriodDates({ startsOn: "2026-08-01", endsOn: "2026-08-02" }),
    ).toEqual({
      ok: true,
      value: { startsOn: "2026-08-01", endsOn: "2026-08-02" },
    });
  });

  it.each([
    ["no start", "", "2027-01-31"],
    ["no end", "2026-08-01", ""],
    ["a day written another way", "01/08/2026", "2027-01-31"],
    ["a day that does not exist", "2026-08-01", "2027-02-30"],
    ["a month that does not exist", "2026-13-01", "2027-01-31"],
  ])("refuses %s", (_what, startsOn, endsOn) => {
    expect(parsePeriodDates({ startsOn, endsOn })).toEqual({
      ok: false,
      error: "Isi tanggal Mulai dan Selesai.",
    });
  });

  it.each([
    ["a hand-made year 0", "0000-01-01", "2027-01-31"],
    ["a start before 2000", "1999-12-31", "2000-06-30"],
    ["an end far ahead", "2026-08-01", "2207-01-31"],
    ["an end after 2101", "2101-08-01", "2102-01-01"],
  ])("refuses %s", (_what, startsOn, endsOn) => {
    expect(parsePeriodDates({ startsOn, endsOn })).toEqual({
      ok: false,
      error: "Mulai dan Selesai harus di antara tahun 2000 dan 2101.",
    });
  });

  it("takes the first and the last day allowed", () => {
    expect(
      parsePeriodDates({ startsOn: "2000-01-01", endsOn: "2101-12-31" }).ok,
    ).toBe(true);
  });

  it.each([
    ["the same day as the start", "2026-08-01"],
    ["a day before the start", "2026-07-31"],
  ])("refuses an end on %s", (_what, endsOn) => {
    expect(parsePeriodDates({ startsOn: "2026-08-01", endsOn })).toEqual({
      ok: false,
      error: "Selesai harus setelah Mulai.",
    });
  });
});
