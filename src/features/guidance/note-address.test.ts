import { describe, expect, it } from "vitest";
import {
  NOTES_ADDRESS,
  NOTES_START,
  notesAddress,
  readNotesParams,
} from "./note-address";

describe("readNotesParams", () => {
  it("starts with nothing chosen on the first page", () => {
    expect(readNotesParams({})).toEqual(NOTES_START);
  });

  it("reads the search, the Kategori, the past notes and the page", () => {
    expect(
      readNotesParams({
        cari: " Mega ",
        kategori: "lanjutan",
        lama: "1",
        hal: "3",
      }),
    ).toEqual({ query: "Mega", category: "further", past: true, page: 3 });
    expect(readNotesParams({ kategori: "pertama" }).category).toBe("first");
  });

  it("takes what it does not understand as not chosen", () => {
    expect(
      readNotesParams({
        cari: "a".repeat(101),
        kategori: "semua",
        lama: "ya",
        hal: "0",
      }),
    ).toEqual(NOTES_START);
    expect(readNotesParams({ hal: "-2" }).page).toBe(1);
    expect(readNotesParams({ hal: ["2", "5"] }).page).toBe(2);
  });
});

describe("notesAddress", () => {
  it("leaves out what is not chosen and the first page", () => {
    expect(notesAddress(NOTES_START)).toBe(NOTES_ADDRESS);
  });

  it("writes every choice, so it reads back the same", () => {
    const params = {
      query: "Mega",
      category: "first",
      past: true,
      page: 2,
    } as const;
    const address = notesAddress(params);

    expect(address).toBe(
      `${NOTES_ADDRESS}?cari=Mega&kategori=pertama&lama=1&hal=2`,
    );
    const search = Object.fromEntries(
      new URL(address, "http://medali").searchParams,
    );
    expect(readNotesParams(search)).toEqual(params);
  });
});
