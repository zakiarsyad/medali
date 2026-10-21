import { describe, expect, it } from "vitest";
import {
  COUNSELLING_LIST_FILTER_WORDS,
  COUNSELLING_LIST_FILTERS,
  counsellingListAddress,
  readCounsellingListParams,
} from "./counselling-list-address";

describe("the address of Daftar mahasiswa on Konseling", () => {
  it("reads the search, the filter and the page", () => {
    expect(
      readCounsellingListParams({
        cari: " Bayu ",
        filter: "disetujui",
        "hal-mahasiswa": "2",
      }),
    ).toEqual({ query: "Bayu", filter: "approved", page: 2 });
    expect(
      readCounsellingListParams({ filter: "menunggu-persetujuan" }).filter,
    ).toBe("waiting");
    expect(
      readCounsellingListParams({ filter: "ada-sesi-berikutnya" }).filter,
    ).toBe("next_session");
  });

  it("takes what it does not understand as not chosen", () => {
    expect(
      readCounsellingListParams({
        filter: "perlu-konseling",
        "hal-mahasiswa": "-3",
        cari: [],
      }),
    ).toEqual({ query: "", filter: "all", page: 1 });
  });

  it("does not read the page of Jadwal konseling as its own", () => {
    expect(readCounsellingListParams({ hal: "4" }).page).toBe(1);
  });

  it("leaves out what is not chosen, and puts back what is", () => {
    expect(counsellingListAddress({ query: "", filter: "all", page: 1 })).toBe(
      "/konseling",
    );
    expect(
      counsellingListAddress({ query: "Bayu", filter: "waiting", page: 3 }),
    ).toBe("/konseling?cari=Bayu&filter=menunggu-persetujuan&hal-mahasiswa=3");
  });

  it("offers Semua, Menunggu persetujuan, Disetujui and Ada sesi berikutnya", () => {
    expect(
      COUNSELLING_LIST_FILTERS.map(
        (each) => COUNSELLING_LIST_FILTER_WORDS[each],
      ),
    ).toEqual([
      "Semua",
      "Menunggu persetujuan",
      "Disetujui",
      "Ada sesi berikutnya",
    ]);
  });
});
