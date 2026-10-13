import { describe, expect, it } from "vitest";
import { NOTE_KINDS } from "./note-kinds";
import {
  KIND_PATHS,
  NOTES_ADDRESS,
  noteStudentAddress,
  notesAddress,
  readNotesParams,
  writeNoteAddress,
} from "./notes-address";

const STUDENT_ID = "0b4f6c1e-6f0e-4f55-9d0a-0d3c1e2f4a11";
const NOTHING = { kind: null, page: 1, detailId: null, writeForId: null };

function paramsOf(address: string): Record<string, string> {
  const url = new URL(address, "http://localhost");
  return Object.fromEntries(url.searchParams);
}

describe("readNotesParams", () => {
  it("reads nothing chosen from an empty address", () => {
    expect(readNotesParams({})).toEqual(NOTHING);
  });

  it("reads the kind and the page", () => {
    expect(readNotesParams({ jenis: "apresiasi", hal: "3" })).toEqual({
      ...NOTHING,
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

  it("reads the student whose detail is open, and the student the form opens with", () => {
    const params = readNotesParams({ profil: STUDENT_ID, tulis: STUDENT_ID });

    expect(params.detailId).toBe(STUDENT_ID);
    expect(params.writeForId).toBe(STUDENT_ID);
  });

  it("keeps of an id no more than an id is long, and counts an empty one as none", () => {
    const params = readNotesParams({
      profil: `${STUDENT_ID}-lebih`,
      tulis: " ",
    });

    expect(params.detailId).toBe(STUDENT_ID);
    expect(params.writeForId).toBeNull();
  });
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
    const read = readNotesParams(paramsOf(notesAddress(kind, 2)));

    expect(read).toEqual({ ...NOTHING, kind, page: 2 });
  });

  it("gives every kind a word of its own in the address", () => {
    const words = NOTE_KINDS.map((kind) => KIND_PATHS[kind]);

    expect(new Set(words).size).toBe(NOTE_KINDS.length);
  });
});

describe("noteStudentAddress", () => {
  it("opens the detail over the same page of the same list", () => {
    const address = noteStudentAddress("appreciation", 3, STUDENT_ID);

    expect(readNotesParams(paramsOf(address))).toEqual({
      kind: "appreciation",
      page: 3,
      detailId: STUDENT_ID,
      writeForId: null,
    });
  });

  it("closes to the list as it was left", () => {
    const address = noteStudentAddress("appreciation", 3, STUDENT_ID);
    const { kind, page } = readNotesParams(paramsOf(address));

    expect(notesAddress(kind, page)).toBe(
      "/pengasuhan/catatan?jenis=apresiasi&hal=3",
    );
  });
});

describe("writeNoteAddress", () => {
  it("opens the tab with the form for one student, and no detail", () => {
    const address = writeNoteAddress(STUDENT_ID);

    expect(address).toBe(`/pengasuhan/catatan?tulis=${STUDENT_ID}`);
    expect(readNotesParams(paramsOf(address))).toEqual({
      ...NOTHING,
      writeForId: STUDENT_ID,
    });
  });
});
