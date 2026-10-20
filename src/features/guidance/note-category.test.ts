import { describe, expect, it } from "vitest";
import { categoryAt, isRepeated, repeatWords } from "./note-category";

describe("categoryAt", () => {
  it("makes the first note of a student in a semester Pelanggaran pertama", () => {
    expect(categoryAt(1)).toBe("first");
  });

  it.each([2, 3, 10])(
    "makes the note in place %i Pelanggaran lanjutan",
    (place) => {
      expect(categoryAt(place)).toBe("further");
    },
  );
});

describe("isRepeated", () => {
  it("marks a student with two active notes or more as Mahasiswa berulang", () => {
    expect(isRepeated(0)).toBe(false);
    expect(isRepeated(1)).toBe(false);
    expect(isRepeated(2)).toBe(true);
    expect(isRepeated(5)).toBe(true);
  });
});

describe("repeatWords", () => {
  it("says how many active notes a repeated student has, and nothing for one", () => {
    expect(repeatWords(3)).toBe("3 catatan aktif");
    expect(repeatWords(1)).toBeNull();
    expect(repeatWords(null)).toBeNull();
  });
});
