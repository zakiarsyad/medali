import { describe, expect, it } from "vitest";
import {
  checkDraft,
  checkWords,
  READY_WORDS,
  whatHoldsBack,
} from "./draft-check";

function group(mentorId: string | null, members = 30) {
  return { mentorId, members };
}

describe("checkDraft", () => {
  it("passes groups that each have a mentor of their own", () => {
    expect(checkDraft([group("ani"), group("budi")])).toEqual({
      withoutMentor: 0,
      mentorsChosenTwice: 0,
      outsideUsualSize: 0,
      isComplete: true,
    });
  });

  it("counts the groups without a mentor, and holds the penetapan back", () => {
    const check = checkDraft([group(null), group("ani"), group(null)]);

    expect(check.withoutMentor).toBe(2);
    expect(check.isComplete).toBe(false);
  });

  it("counts the mentors chosen for more than one group, each once, and holds the penetapan back", () => {
    const check = checkDraft([
      group("ani"),
      group("ani"),
      group("ani"),
      group("budi"),
      group("budi"),
      group("candra"),
    ]);

    expect(check.mentorsChosenTwice).toBe(2);
    expect(check.withoutMentor).toBe(0);
    expect(check.isComplete).toBe(false);
  });

  it("counts the groups outside 25 to 35 as a warning only", () => {
    const check = checkDraft([
      group("ani", 24),
      group("budi", 36),
      group("candra", 25),
      group("dewi", 35),
    ]);

    expect(check.outsideUsualSize).toBe(2);
    expect(check.isComplete).toBe(true);
  });

  it("holds back a penetapan that has no group", () => {
    expect(checkDraft([])).toEqual({
      withoutMentor: 0,
      mentorsChosenTwice: 0,
      outsideUsualSize: 0,
      isComplete: false,
    });
  });
});

describe("whatHoldsBack", () => {
  it("is null for a draft that may be submitted and fixed, also with a warning", () => {
    expect(whatHoldsBack(checkDraft([group("ani", 17)]))).toBe(null);
  });

  it("says what holds the penetapan back, without the warning", () => {
    const check = checkDraft([group(null, 17), group("ani"), group("ani")]);

    expect(whatHoldsBack(check)).toBe(
      "Draf belum bisa diajukan atau ditetapkan. 1 kelompok belum punya pengasuh. 1 pengasuh dipilih untuk lebih dari satu kelompok.",
    );
  });
});

describe("checkWords", () => {
  it("says the draft is ready when every group has a mentor of its own", () => {
    const check = checkDraft([group("ani"), group("budi")]);

    expect(checkWords(check)).toEqual([READY_WORDS]);
  });

  it("names the groups without a mentor and the mentors chosen twice, and not that it is ready", () => {
    const check = checkDraft([group(null), group("ani"), group("ani")]);

    expect(checkWords(check)).toEqual([
      "1 kelompok belum punya pengasuh.",
      "1 pengasuh dipilih untuk lebih dari satu kelompok.",
    ]);
  });

  it("adds the groups of an unusual size as a warning beside being ready", () => {
    const check = checkDraft([group("ani", 17), group("budi")]);

    expect(checkWords(check)).toEqual([
      "1 kelompok di luar ukuran 25–35 (boleh, misalnya prodi kecil).",
      READY_WORDS,
    ]);
  });
});
