import { describe, expect, it } from "vitest";
import {
  meetingsOverview,
  type StoredMark,
  type StoredMeeting,
} from "./meetings-overview";

function meeting(number: number): StoredMeeting {
  return {
    id: `meeting-${number}`,
    number,
    heldOn: `2026-09-0${number}`,
    topic: `Topik ${number}`,
    version: 1,
  };
}

function mark(
  number: number,
  studentId: string,
  value: StoredMark["mark"],
): StoredMark {
  return { meetingId: `meeting-${number}`, studentId, mark: value };
}

describe("meetingsOverview", () => {
  it("has a card for each of the four meetings, in order, filled in or not", () => {
    const overview = meetingsOverview(["a"], [meeting(3), meeting(1)], []);

    expect(overview.cards.map((card) => card.number)).toEqual([1, 2, 3, 4]);
    expect(overview.cards.map((card) => card.stored?.topic ?? null)).toEqual([
      "Topik 1",
      null,
      "Topik 3",
      null,
    ]);
    expect(overview.held).toBe(2);
  });

  it("counts the marks of each meeting", () => {
    const overview = meetingsOverview(
      ["a", "b", "c"],
      [meeting(1)],
      [mark(1, "a", "present"), mark(1, "b", "present"), mark(1, "c", "sick")],
    );

    expect(overview.cards[0]?.stored?.counts).toEqual({
      present: 2,
      excused: 0,
      sick: 1,
      absent: 0,
    });
  });

  it("leaves out the mark of a student who is no member today, in the counts and in the average", () => {
    const overview = meetingsOverview(
      ["a"],
      [meeting(1)],
      [mark(1, "a", "present"), mark(1, "left", "absent")],
    );

    expect(overview.cards[0]?.stored?.counts.absent).toBe(0);
    expect(overview.average).toBe(100);
  });

  it("averages the members' own shares over every meeting of the period", () => {
    const overview = meetingsOverview(
      ["a", "b"],
      [meeting(1), meeting(2)],
      [
        mark(1, "a", "present"),
        mark(2, "a", "present"),
        mark(1, "b", "present"),
        mark(2, "b", "absent"),
      ],
    );

    expect(overview.average).toBe(75);
  });

  it("does not count a member for a meeting they have no mark in", () => {
    // "b" joined after meeting 1: only meeting 2 counts for them.
    const overview = meetingsOverview(
      ["a", "b"],
      [meeting(1), meeting(2)],
      [
        mark(1, "a", "present"),
        mark(2, "a", "present"),
        mark(2, "b", "present"),
      ],
    );

    expect(overview.average).toBe(100);
  });

  it("has no average while nothing is filled in", () => {
    const overview = meetingsOverview(["a", "b"], [], []);

    expect(overview.held).toBe(0);
    expect(overview.average).toBeNull();
  });
});
