import { describe, expect, it } from "vitest";
import { NOTE_KINDS } from "./note-kinds";
import {
  KIND_PATHS,
  NOTES_ADDRESS,
  notesAddress,
  readNotesParams,
} from "./notes-address";

describe("readNotesParams", () => {
  it("reads nothing chosen from an empty address", () => {
    expect(readNotesParams({})).toEqual({ kind: null, page: 1 });
  });

  it("reads the kind and the page", () => {
    expect(readNotesParams({ jenis: "apresiasi", hal: "3" })).toEqual({
      kind: "appreciation",
      page: 3,
    });
  });

  it("takes the first of a part that is repeated", () => {
    expect(readNotesParams({ jenis: ["disiplin", "apresiasi"] }).kind).toBe(
      "discipline_guidance",
    );
  });

  it.each(["", "semua", "appreciation", "<script>"])(
    "counts a kind it does not know (%j) as not chosen",
    (jenis) => {
      expect(readNotesParams({ jenis }).kind).toBeNull();
    },
  );

  it.each(["0", "-1", "1.5", "abc", "1e3", ""])(
    "reads the first page from %j",
    (hal) => {
      expect(readNotesParams({ hal }).page).toBe(1);
    },
  );
});

describe("notesAddress", () => {
  it("is the tab alone when nothing is chosen", () => {
    expect(notesAddress(null)).toBe(NOTES_ADDRESS);
    expect(notesAddress(null, 1)).toBe(NOTES_ADDRESS);
  });

  it("names the kind and the page, and leaves out the first page", () => {
    expect(notesAddress("parent_visit")).toBe(
      "/pengasuhan/catatan?jenis=kunjungan",
    );
    expect(notesAddress("parent_visit", 2)).toBe(
      "/pengasuhan/catatan?jenis=kunjungan&hal=2",
    );
    expect(notesAddress(null, 4)).toBe("/pengasuhan/catatan?hal=4");
  });

  it.each(NOTE_KINDS)("is read back as it was written, for %s", (kind) => {
    const address = new URL(notesAddress(kind, 2), "http://localhost");
    const params = Object.fromEntries(address.searchParams);

    expect(readNotesParams(params)).toEqual({ kind, page: 2 });
  });

  it("gives every kind a word of its own in the address", () => {
    const words = NOTE_KINDS.map((kind) => KIND_PATHS[kind]);

    expect(new Set(words).size).toBe(NOTE_KINDS.length);
  });
});
