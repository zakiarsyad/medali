import { describe, expect, it } from "vitest";
import {
  type CleaningParams,
  cleaningAddress,
  readCleaningParams,
  shownDorms,
} from "./cleaning-address";

const TODAY = "2026-10-15";

describe("readCleaningParams", () => {
  it("opens Semua asrama on today, on the first page", () => {
    expect(readCleaningParams({}, TODAY)).toEqual({
      dorm: null,
      day: TODAY,
      page: 1,
      scorePage: 1,
    });
  });

  it("reads the dorm, the date and the pages, the first of each when given twice", () => {
    expect(
      readCleaningParams(
        {
          asrama: ["cipta_bakti", "dana_rakca"],
          tgl: "2026-10-20",
          hal: "2",
          skor: ["3", "4"],
        },
        TODAY,
      ),
    ).toEqual({
      dorm: "cipta_bakti",
      day: "2026-10-20",
      page: 2,
      scorePage: 3,
    });
  });

  it("opens Semua asrama for a dorm that is not one", () => {
    expect(
      readCleaningParams({ asrama: "asrama_lain" }, TODAY).dorm,
    ).toBeNull();
  });

  it.each(["2026-02-30", "kemarin", "1999-12-31", "2200-01-01"])(
    "opens today for the date %s",
    (tgl) => {
      expect(readCleaningParams({ tgl }, TODAY).day).toBe(TODAY);
    },
  );

  it.each(["0", "-1", "dua", "02", "1234567"])(
    "opens the first page for the page %s",
    (hal) => {
      expect(readCleaningParams({ hal }, TODAY).page).toBe(1);
      expect(readCleaningParams({ skor: hal }, TODAY).scorePage).toBe(1);
    },
  );
});

describe("shownDorms", () => {
  it("shows all four dorms for Semua asrama, and one dorm when picked", () => {
    expect(shownDorms({ dorm: null })).toHaveLength(4);
    expect(shownDorms({ dorm: "cipta_bakti" })).toEqual(["cipta_bakti"]);
  });
});

describe("cleaningAddress", () => {
  it("leaves Semua asrama, today and the first pages out", () => {
    expect(
      cleaningAddress({ dorm: null, day: TODAY, page: 1, scorePage: 1 }, TODAY),
    ).toBe("/asrama/bersih");
  });

  it("gives back what it is read as", () => {
    const params: CleaningParams = {
      dorm: "wismantara_putri",
      day: "2026-10-12",
      page: 3,
      scorePage: 2,
    };
    const query = cleaningAddress(params, TODAY).split("?")[1] ?? "";
    const read = readCleaningParams(
      Object.fromEntries(new URLSearchParams(query)),
      TODAY,
    );

    expect(read).toEqual(params);
  });
});
