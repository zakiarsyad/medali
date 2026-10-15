import { describe, expect, it } from "vitest";
import {
  attendanceNote,
  outNote,
  residentsNote,
  totalResidents,
} from "./dashboard-words";

const RESIDENTS = {
  wismantara_putra: 12,
  wismantara_putri: 9,
  dana_rakca: 1250,
  cipta_bakti: 0,
};

describe("residentsNote", () => {
  it("names each dorm by its short name with its residents", () => {
    expect(residentsNote(RESIDENTS)).toBe(
      "Wismantara Putra 12 · Wismantara Putri 9 · Dana Rakca 1.250 · Cipta Bakti 0",
    );
  });
});

describe("totalResidents", () => {
  it("adds up the residents of every dorm", () => {
    expect(totalResidents(RESIDENTS)).toBe(1271);
  });
});

describe("outNote", () => {
  it("says how many are late, or that the leave is approved when none is", () => {
    expect(outNote(2)).toBe("2 terlambat kembali");
    expect(outNote(0)).toBe("dengan izin disetujui");
  });
});

describe("attendanceNote", () => {
  it("says how many activities were counted, leave left out, or that none is announced yet", () => {
    expect(attendanceNote(14)).toBe("14 kegiatan, izin tidak dihitung");
    expect(attendanceNote(0)).toBe("Belum ada kegiatan yang diumumkan");
  });
});
