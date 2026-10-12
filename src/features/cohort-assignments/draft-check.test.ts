import { describe, expect, it } from "vitest";
import {
  checkDraft,
  checkOfGroups,
  checkWords,
  type GroupToCheck,
  READY_WORDS,
  whatHoldsBack,
} from "./draft-check";

function group(mentorId: string | null, members = 30) {
  return { mentorId, members };
}

const EVERYONE_PLACED = { outsideDraft: 0, inWrongGroup: 0 };

/** The check of groups whose students are all placed rightly. */
function check(groups: GroupToCheck[]) {
  return checkDraft(groups, EVERYONE_PLACED);
}

const NOTHING_FOUND = {
  withoutMentor: 0,
  mentorsChosenTwice: 0,
  withoutMembers: 0,
  studentsOutside: 0,
  membersInWrongGroup: 0,
  outsideUsualSize: 0,
};

describe("checkDraft", () => {
  it("passes groups that each have a mentor of their own", () => {
    expect(check([group("ani"), group("budi")])).toEqual({
      ...NOTHING_FOUND,
      isComplete: true,
    });
  });

  it("counts the groups without a mentor, and holds the penetapan back", () => {
    const found = check([group(null), group("ani"), group(null)]);

    expect(found.withoutMentor).toBe(2);
    expect(found.isComplete).toBe(false);
  });

  it("counts the mentors chosen for more than one group, each once, and holds the penetapan back", () => {
    const found = check([
      group("ani"),
      group("ani"),
      group("ani"),
      group("budi"),
      group("budi"),
      group("candra"),
    ]);

    expect(found.mentorsChosenTwice).toBe(2);
    expect(found.withoutMentor).toBe(0);
    expect(found.isComplete).toBe(false);
  });

  it("counts the groups without a member, and holds the penetapan back", () => {
    const found = check([group("ani", 0), group("budi"), group("candra", 0)]);

    expect(found.withoutMembers).toBe(2);
    expect(found.isComplete).toBe(false);
  });

  it("holds the penetapan back for waiting students who are in no group", () => {
    const found = checkDraft([group("ani")], {
      outsideDraft: 1,
      inWrongGroup: 0,
    });

    expect(found.studentsOutside).toBe(1);
    expect(found.isComplete).toBe(false);
  });

  it("holds the penetapan back for members of another program studi or jalur than their group", () => {
    const found = checkDraft([group("ani")], {
      outsideDraft: 0,
      inWrongGroup: 2,
    });

    expect(found.membersInWrongGroup).toBe(2);
    expect(found.isComplete).toBe(false);
  });

  it("counts the groups outside 25 to 35 as a warning only", () => {
    const found = check([
      group("ani", 24),
      group("budi", 36),
      group("candra", 25),
      group("dewi", 35),
    ]);

    expect(found.outsideUsualSize).toBe(2);
    expect(found.isComplete).toBe(true);
  });

  it("holds back a penetapan that has no group", () => {
    expect(check([])).toEqual({ ...NOTHING_FOUND, isComplete: false });
  });
});

describe("checkOfGroups", () => {
  const stored = {
    studyProgramId: 1,
    entryPath: "regular" as const,
    mentor: { id: "ani" },
    members: [{ id: "s1" }],
  };
  const s1 = { id: "s1", studyProgramId: 1, entryPath: "regular" as const };

  it("passes a stored group whose member waits in its program studi and jalur", () => {
    expect(checkOfGroups([stored], [s1]).isComplete).toBe(true);
  });

  it("finds the waiting student outside the draft and the member of another program studi", () => {
    const found = checkOfGroups(
      [stored],
      [
        { ...s1, studyProgramId: 2 },
        { ...s1, id: "s2" },
      ],
    );

    expect(found).toMatchObject({
      studentsOutside: 1,
      membersInWrongGroup: 1,
      isComplete: false,
    });
  });
});

describe("whatHoldsBack", () => {
  it("is null for a draft that may be submitted and fixed, also with a warning", () => {
    expect(whatHoldsBack(check([group("ani", 17)]))).toBe(null);
  });

  it("says what holds the penetapan back, without the warning", () => {
    const found = check([group(null, 17), group("ani"), group("ani")]);

    expect(whatHoldsBack(found)).toBe(
      "Draf belum bisa diajukan atau ditetapkan. 1 kelompok belum punya pengasuh. 1 pengasuh dipilih untuk lebih dari satu kelompok.",
    );
  });

  it("says how many groups are empty and how many students are left out or misplaced, and what to do", () => {
    const found = checkDraft([group("ani", 0), group("budi")], {
      outsideDraft: 1,
      inWrongGroup: 2,
    });

    expect(whatHoldsBack(found)).toBe(
      'Draf belum bisa diajukan atau ditetapkan. 1 kelompok tidak punya anggota. Tekan "Bentuk ulang", atau pindahkan anggota dari kelompok lain pada program studi dan jalur yang sama bila ada. 1 mahasiswa angkatan ini belum masuk kelompok mana pun pada draf. Tekan "Bentuk ulang" agar ikut dibagi ke kelompok. 2 mahasiswa pada draf sudah berganti program studi atau jalur. Tekan "Bentuk ulang" agar masuk kelompok yang sesuai.',
    );
  });
});

describe("checkWords", () => {
  it("says the draft is ready when every group has a mentor of its own", () => {
    const found = check([group("ani"), group("budi")]);

    expect(checkWords(found)).toEqual([READY_WORDS]);
  });

  it("names the groups without a mentor and the mentors chosen twice, and not that it is ready", () => {
    const found = check([group(null), group("ani"), group("ani")]);

    expect(checkWords(found)).toEqual([
      "1 kelompok belum punya pengasuh.",
      "1 pengasuh dipilih untuk lebih dari satu kelompok.",
    ]);
  });

  it("names the students left out of the draft, and not that it is ready", () => {
    const found = checkDraft([group("ani")], {
      outsideDraft: 1,
      inWrongGroup: 0,
    });

    expect(checkWords(found)).toEqual([
      '1 mahasiswa angkatan ini belum masuk kelompok mana pun pada draf. Tekan "Bentuk ulang" agar ikut dibagi ke kelompok.',
    ]);
  });

  it("adds the groups of an unusual size as a warning beside being ready", () => {
    const found = check([group("ani", 17), group("budi")]);

    expect(checkWords(found)).toEqual([
      "1 kelompok di luar ukuran 25–35 (boleh, misalnya prodi kecil).",
      READY_WORDS,
    ]);
  });
});
