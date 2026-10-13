import { describe, expect, it } from "vitest";
import { historyAddress, readHistoryPage } from "./history-address";

describe("readHistoryPage", () => {
  it("reads the page asked for", () => {
    expect(readHistoryPage({ hal: "3" })).toBe(3);
    expect(readHistoryPage({ hal: ["2", "9"] })).toBe(2);
  });

  it.each([
    [{}],
    [{ hal: "" }],
    [{ hal: "0" }],
    [{ hal: "-1" }],
    [{ hal: "2.5" }],
    [{ hal: "dua" }],
    [{ hal: "1; drop table" }],
  ])("takes %j for the first page", (params) => {
    expect(readHistoryPage(params)).toBe(1);
  });
});

describe("historyAddress", () => {
  it("is Kegiatan karakter itself for the first page", () => {
    expect(historyAddress(1)).toBe("/kegiatan");
  });

  it("names any later page", () => {
    expect(historyAddress(2)).toBe("/kegiatan?hal=2");
  });

  it("is read back as the same page", () => {
    const search = new URL(historyAddress(4), "http://uji.test").searchParams;

    expect(readHistoryPage(Object.fromEntries(search))).toBe(4);
  });
});
