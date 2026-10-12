import { describe, expect, it } from "vitest";
import { companionsAddress, readCompanionsParams } from "./companions-address";

describe("readCompanionsParams", () => {
  it("opens the first page", () => {
    expect(readCompanionsParams({})).toEqual({ page: 1 });
  });

  it("reads the page", () => {
    expect(readCompanionsParams({ hal: "3" })).toEqual({ page: 3 });
  });

  it.each(["0", "-1", "2.5", "dua", "02", "1234567"])(
    "opens the first page for the page %s",
    (hal) => {
      expect(readCompanionsParams({ hal }).page).toBe(1);
    },
  );

  it("takes the first of a page that is given twice", () => {
    expect(readCompanionsParams({ hal: ["2", "5"] }).page).toBe(2);
  });
});

describe("companionsAddress", () => {
  it("leaves the first page out", () => {
    expect(companionsAddress(1)).toBe("/asrama/kakak");
  });

  it("writes a later page the way it is read", () => {
    const address = companionsAddress(4);
    expect(address).toBe("/asrama/kakak?hal=4");
    const query = new URLSearchParams(address.split("?")[1]);
    expect(readCompanionsParams(Object.fromEntries(query)).page).toBe(4);
  });
});
