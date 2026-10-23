import { describe, expect, it } from "vitest";
import {
  type MentorSums,
  resultNumbers,
  resultPage,
  type SurveyGroup,
  surveyGroupRows,
} from "./survey-group-list";
import { NO_RESULT_CHOICES } from "./survey-results-address";

function group(number: number, more: Partial<SurveyGroup> = {}): SurveyGroup {
  return {
    id: `kelompok-${number}`,
    cohortYear: 2025,
    entryPath: "regular",
    number,
    programCode: "D3PJK",
    studyProgram: "D3 Pajak",
    members: 4,
    mentorId: `pengasuh-${number}`,
    mentorName: `Pengasuh Uji ${number}`,
    ...more,
  };
}

/** Answers that all give one score to each of the eight statements. */
function sums(
  groupId: string,
  mentor: string,
  ...scores: number[]
): MentorSums {
  let total = 0;
  for (const score of scores) total += score * 8;
  return {
    groupId,
    mentorId: mentor,
    mentorName: `Nama ${mentor}`,
    answers: scores.length,
    total,
  };
}

describe("surveyGroupRows", () => {
  it("gives a group without answers one row, with the mentor who held it on the day", () => {
    const rows = surveyGroupRows([group(1)], [], new Map(), 50);

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      key: "kelompok-1 pengasuh-1",
      mentorId: "pengasuh-1",
      mentorName: "Pengasuh Uji 1",
      result: { answers: 0, members: 4, share: 0, achievement: null },
    });
  });

  it("gives a group the numbers of its answers and its Capaian karakter", () => {
    const rows = surveyGroupRows(
      [group(1)],
      [sums("kelompok-1", "pengasuh-1", 4, 4, 4)],
      new Map([["kelompok-1", 70]]),
      50,
    );

    expect(rows[0]?.result).toEqual({
      answers: 3,
      members: 4,
      share: 75,
      achievement: 70,
      feedbackOutOfFive: 4,
      feedback: 80,
      score: 75,
      result: "fair",
    });
    expect(rows[0]?.mentorName).toBe("Nama pengasuh-1");
  });

  it("counts an answer for the mentor it was sent for: a group whose mentor changed has a row for each", () => {
    const rows = surveyGroupRows(
      [group(1, { mentorId: "pengasuh-baru", mentorName: "Baru" })],
      [
        sums("kelompok-1", "pengasuh-lama", 4, 4, 4),
        sums("kelompok-1", "pengasuh-baru", 2),
      ],
      new Map(),
      50,
    );

    expect(rows.map((row) => [row.mentorId, row.result.answers])).toEqual([
      ["pengasuh-lama", 3],
      ["pengasuh-baru", 1],
    ]);
    expect(rows.map((row) => row.result.members)).toEqual([4, 4]);
  });

  it("gives a group with fewer than 3 answers no Umpan balik, Nilai evaluasi nor Predikat", () => {
    const rows = surveyGroupRows(
      [group(1)],
      [sums("kelompok-1", "pengasuh-1", 5, 5)],
      new Map([["kelompok-1", 90]]),
      50,
    );

    expect(rows[0]?.result).toMatchObject({
      answers: 2,
      achievement: 90,
      feedbackOutOfFive: null,
      feedback: null,
      score: null,
      result: null,
    });
  });
});

describe("resultPage", () => {
  const rows = surveyGroupRows(
    [
      group(1),
      group(2, { mentorName: "Siti Rahmawati" }),
      group(3),
      group(4, { programCode: "ASP" }),
    ],
    [
      sums("kelompok-1", "pengasuh-1", 5, 5, 5),
      sums("kelompok-3", "pengasuh-3", 2, 2, 2),
      sums("kelompok-4", "pengasuh-4", 3, 3),
    ],
    new Map([
      ["kelompok-1", 80],
      ["kelompok-3", 60],
      ["kelompok-4", 70],
    ]),
    50,
  );

  it("puts the lowest Nilai evaluasi first, and the groups without one last, by their code", () => {
    const page = resultPage(rows, NO_RESULT_CHOICES);

    expect(page.rows.map((row) => row.key)).toEqual([
      "kelompok-3 pengasuh-3",
      "kelompok-1 pengasuh-1",
      "kelompok-4 pengasuh-4",
      "kelompok-2 pengasuh-2",
    ]);
    expect(page.matching).toBe(4);
  });

  it("searches the group code and the name of the mentor, whatever the case", () => {
    const byCode = resultPage(rows, {
      ...NO_RESULT_CHOICES,
      query: "kp 25-asp",
    });
    const byMentor = resultPage(rows, { ...NO_RESULT_CHOICES, query: "siti" });

    expect(byCode.rows.map((row) => row.key)).toEqual([
      "kelompok-4 pengasuh-4",
    ]);
    expect(byMentor.rows.map((row) => row.key)).toEqual([
      "kelompok-2 pengasuh-2",
    ]);
  });

  it("narrows to Nilai kurang, or to the groups without answers", () => {
    const poor = resultPage(rows, { ...NO_RESULT_CHOICES, filter: "poor" });
    const none = resultPage(rows, {
      ...NO_RESULT_CHOICES,
      filter: "no_answers",
    });

    expect(poor.rows.map((row) => row.key)).toEqual(["kelompok-3 pengasuh-3"]);
    expect(none.rows.map((row) => row.key)).toEqual(["kelompok-2 pengasuh-2"]);
  });

  it("finds nothing when nothing matches", () => {
    const page = resultPage(rows, { ...NO_RESULT_CHOICES, query: "tidak ada" });

    expect(page).toEqual({ rows: [], matching: 0, page: 1 });
  });

  it("gives 25 rows a page, and the last page for a page past it", () => {
    const many = surveyGroupRows(
      Array.from({ length: 30 }, (_, place) => group(place + 1)),
      [],
      new Map(),
      50,
    );

    expect(resultPage(many, NO_RESULT_CHOICES).rows).toHaveLength(25);
    const second = resultPage(many, { ...NO_RESULT_CHOICES, page: 2 });
    expect(second.rows).toHaveLength(5);
    expect(resultPage(many, { ...NO_RESULT_CHOICES, page: 9 }).page).toBe(2);
  });
});

describe("resultNumbers", () => {
  it("adds up Responden, the averages and the groups with Kurang over every group", () => {
    const rows = surveyGroupRows(
      [group(1), group(2, { members: 2 }), group(3)],
      [
        sums("kelompok-1", "pengasuh-1", 5, 5, 4),
        sums("kelompok-2", "pengasuh-2", 1),
        sums("kelompok-3", "pengasuh-3", 2, 2, 2),
      ],
      new Map([
        ["kelompok-1", 81],
        ["kelompok-3", 60],
      ]),
      50,
    );

    expect(resultNumbers(rows)).toEqual({
      answers: 7,
      members: 10,
      share: 70,
      achievement: 70.5,
      feedbackOutOfFive: 3.4,
      feedback: 66.7,
      poor: 1,
      groups: 3,
      fixable: 2,
    });
  });

  it("counts the members of a group with two mentors once", () => {
    const rows = surveyGroupRows(
      [group(1)],
      [
        sums("kelompok-1", "pengasuh-lama", 4),
        sums("kelompok-1", "pengasuh-baru", 4),
      ],
      new Map(),
      50,
    );

    expect(resultNumbers(rows)).toMatchObject({
      answers: 2,
      members: 4,
      groups: 1,
    });
  });

  it("has no averages without groups that show them", () => {
    const rows = surveyGroupRows([group(1)], [], new Map(), 50);

    expect(resultNumbers(rows)).toEqual({
      answers: 0,
      members: 4,
      share: 0,
      achievement: null,
      feedbackOutOfFive: null,
      feedback: null,
      poor: 0,
      groups: 1,
      fixable: 0,
    });
  });
});
