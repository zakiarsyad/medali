import { describe, expect, it } from "vitest";
import {
  ACTIVITIES_ADDRESS,
  activitiesAddress,
  readActivitiesParams,
} from "./activities-address";

const TODAY = "2026-10-14";

describe("readActivitiesParams", () => {
  it("opens Jadwal harian of today on its first page when the address asks for nothing", () => {
    expect(readActivitiesParams({}, TODAY)).toEqual({
      view: "harian",
      day: TODAY,
      page: 1,
      counted: null,
    });
  });

  it("takes the list, the day and the page the address names", () => {
    const asked = { lihat: "nonrutin", tgl: "2031-02-28", hal: "3" };

    expect(readActivitiesParams(asked, TODAY)).toEqual({
      view: "nonrutin",
      day: "2031-02-28",
      page: 3,
      counted: null,
    });
  });

  it.each([
    "",
    "besok",
    "2026-02-30",
    "14-10-2026",
    "1999-12-31",
    "2200-01-01",
    "0000-01-01",
  ])("takes the day %j as today", (tgl) => {
    expect(readActivitiesParams({ tgl }, TODAY).day).toBe(TODAY);
  });

  it.each(["", "0", "-1", "1.5", "dua", "1234567"])(
    "takes the page %j as the first",
    (hal) => {
      expect(readActivitiesParams({ hal }, TODAY).page).toBe(1);
    },
  );

  it("takes the activity Penghitungan kehadiran is open on, and none that is not a key", () => {
    const counted = "00000000-0000-4000-8000-00000000a001";

    expect(readActivitiesParams({ hitung: counted }, TODAY).counted).toBe(
      counted,
    );
    expect(readActivitiesParams({ hitung: "apel" }, TODAY).counted).toBeNull();
  });

  it("takes a list it does not know as Jadwal harian", () => {
    expect(readActivitiesParams({ lihat: "semua" }, TODAY).view).toBe("harian");
  });
});

describe("activitiesAddress", () => {
  it("leaves out Jadwal harian, today and the first page", () => {
    const address = activitiesAddress(
      { view: "harian", day: TODAY, page: 1, counted: null },
      TODAY,
    );

    expect(address).toBe(ACTIVITIES_ADDRESS);
  });

  it("names another day of Jadwal harian", () => {
    const address = activitiesAddress(
      { view: "harian", day: "2026-10-15", page: 1, counted: null },
      TODAY,
    );

    expect(address).toBe("/asrama/kegiatan?tgl=2026-10-15");
  });

  it("names the list and its page, and no day, for Kegiatan non rutin", () => {
    const address = activitiesAddress(
      { view: "nonrutin", day: "2026-10-15", page: 2, counted: null },
      TODAY,
    );

    expect(address).toBe("/asrama/kegiatan?lihat=nonrutin&hal=2");
  });

  it("names the activity Penghitungan kehadiran is open on in Jadwal harian only", () => {
    const counted = "00000000-0000-4000-8000-00000000a001";

    expect(
      activitiesAddress(
        { view: "harian", day: TODAY, page: 1, counted },
        TODAY,
      ),
    ).toBe(`/asrama/kegiatan?hitung=${counted}`);
    expect(
      activitiesAddress({ view: "rutin", day: TODAY, page: 1, counted }, TODAY),
    ).toBe("/asrama/kegiatan?lihat=rutin");
  });

  it("names only the list for Kegiatan rutin", () => {
    const address = activitiesAddress(
      { view: "rutin", day: "2026-10-15", page: 2, counted: null },
      TODAY,
    );

    expect(address).toBe("/asrama/kegiatan?lihat=rutin");
  });

  it("gives an address that reads back as what it was made from", () => {
    const params = {
      view: "harian",
      day: "2027-01-01",
      page: 1,
      counted: null,
    } as const;
    const address = activitiesAddress(params, TODAY);
    const asked = Object.fromEntries(new URL(address, "http://x").searchParams);

    expect(readActivitiesParams(asked, TODAY)).toEqual(params);
  });
});
