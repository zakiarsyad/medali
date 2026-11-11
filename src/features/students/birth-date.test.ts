import { describe, expect, it } from "vitest";
import { parseBirthDate, shownBirthDate } from "./birth-date";

const TODAY = "2026-11-10";

describe("parseBirthDate", () => {
  it("takes a real day written as MM/DD/YYYY, and keeps it as the database does", () => {
    expect(parseBirthDate("08/17/2005", TODAY)).toEqual({
      ok: true,
      value: "2005-08-17",
    });
    expect(parseBirthDate(" 02/29/2004 ", TODAY)).toEqual({
      ok: true,
      value: "2004-02-29",
    });
  });

  it("takes today", () => {
    expect(parseBirthDate("11/10/2026", TODAY)).toEqual({
      ok: true,
      value: TODAY,
    });
  });

  it.each(["", "   "])("refuses an empty Tanggal lahir '%s'", (text) => {
    expect(parseBirthDate(text, TODAY)).toEqual({
      ok: false,
      error: "Tanggal lahir wajib diisi.",
    });
  });

  it.each([
    "17/8/2005",
    "8/17/2005",
    "08/17/05",
    "2005-08-17",
    "08-17-2005",
    "17 Agustus 2005",
  ])("refuses '%s', which is not written MM/DD/YYYY", (text) => {
    expect(parseBirthDate(text, TODAY)).toEqual({
      ok: false,
      error: "Tanggal lahir harus ditulis MM/DD/YYYY.",
    });
  });

  it.each([
    "02/30/2005",
    "02/29/2005",
    "13/01/2005",
    "00/10/2005",
    "01/01/0000",
  ])("refuses '%s', a day that does not exist", (text) => {
    expect(parseBirthDate(text, TODAY)).toEqual({
      ok: false,
      error: "Tanggal lahir tidak ada di kalender.",
    });
  });

  it("refuses a day after today", () => {
    expect(parseBirthDate("11/11/2026", TODAY)).toEqual({
      ok: false,
      error: "Tanggal lahir tidak boleh setelah hari ini.",
    });
  });
});

describe("shownBirthDate", () => {
  it("writes a kept day as MM/DD/YYYY", () => {
    expect(shownBirthDate("2005-08-17")).toBe("08/17/2005");
  });
});
