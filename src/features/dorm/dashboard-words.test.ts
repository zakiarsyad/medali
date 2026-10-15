import { describe, expect, it } from "vitest";
import {
  attendanceNote,
  countBar,
  outNote,
  rateBar,
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

describe("rateBar", () => {
  it("fills a bar as far as Kehadiran goes, Izin left out", () => {
    expect(rateBar({ present: 3, absent: 1, leave: 5 })).toEqual({
      share: 0.75,
      words: "75%",
    });
  });

  it("leaves a bar with nothing counted empty, with a dash instead of 0%", () => {
    expect(rateBar({ present: 0, absent: 0, leave: 2 })).toEqual({
      share: 0,
      words: "-",
    });
  });
});

describe("countBar", () => {
  it("fills a bar by its share of the total, with the number beside it", () => {
    expect(countBar(3, 12)).toEqual({ share: 0.25, words: "3" });
    expect(countBar(0, 0)).toEqual({ share: 0, words: "0" });
  });
});

describe("attendanceNote", () => {
  it("says how many activities were counted, leave left out, or that none is announced yet", () => {
    expect(attendanceNote(14)).toBe("14 kegiatan, izin tidak dihitung");
    expect(attendanceNote(0)).toBe("Belum ada kegiatan yang diumumkan");
  });
});
