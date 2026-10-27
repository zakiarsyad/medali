import { describe, expect, it } from "vitest";
import { companionsAddress, readCompanionsParams } from "./companions-address";

describe("readCompanionsParams", () => {
  it("opens the first page with no search", () => {
    expect(readCompanionsParams({})).toEqual({ page: 1, query: "" });
  });

  it("reads the page and the search", () => {
    expect(readCompanionsParams({ hal: "3", q: "  sari " })).toEqual({
      page: 3,
      query: "sari",
    });
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

  it("cuts a search that is too long", () => {
    expect(readCompanionsParams({ q: "a".repeat(500) }).query).toHaveLength(
      100,
    );
  });

  it("drops the null character from the search, before it is cut", () => {
    const query = (q: string) => readCompanionsParams({ q }).query;

    expect(query("\0sa\0 ri\0")).toBe("sa ri");
    expect(query("\0 \0 ")).toBe("");
    expect(query(`\0${"a".repeat(100)}`)).toBe("a".repeat(100));
  });
});

describe("companionsAddress", () => {
  it("leaves the first page and an empty search out", () => {
    expect(companionsAddress({ page: 1, query: "" })).toBe("/asrama/kakak");
  });

  it("writes the page and the search the way they are read", () => {
    const params = { page: 4, query: "sari uji" };
    const address = companionsAddress(params);
    expect(address).toBe("/asrama/kakak?q=sari+uji&hal=4");
    const query = new URLSearchParams(address.split("?")[1]);
    expect(readCompanionsParams(Object.fromEntries(query))).toEqual(params);
  });
});
