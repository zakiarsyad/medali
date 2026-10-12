import { describe, expect, it } from "vitest";
import {
  parseDraftKey,
  parseMentorChoice,
  parseMove,
} from "./draft-change-input";

const KEY = { cohortYear: "2026", version: "3" };
const GROUP = "11111111-1111-4111-8111-111111111111";
const OTHER = "22222222-2222-4222-8222-222222222222";

describe("parseDraftKey", () => {
  it("reads the angkatan and the version the draft was shown with", () => {
    expect(parseDraftKey(KEY)).toEqual({
      ok: true,
      value: { cohortYear: 2026, version: 3 },
    });
  });

  it.each([
    { ...KEY, cohortYear: "26" },
    { ...KEY, version: "" },
    { ...KEY, version: "1 or 1=1" },
  ])("refuses what the tab would not send: %o", (sent) => {
    expect(parseDraftKey(sent).ok).toBe(false);
  });
});

describe("parseMentorChoice", () => {
  it("reads the group and the mentor chosen for it", () => {
    const parsed = parseMentorChoice({
      ...KEY,
      groupId: GROUP,
      mentorId: OTHER,
    });

    expect(parsed).toEqual({
      ok: true,
      value: { cohortYear: 2026, version: 3, groupId: GROUP, mentorId: OTHER },
    });
  });

  it("reads an empty choice as leaving the group without a mentor", () => {
    const parsed = parseMentorChoice({ ...KEY, groupId: GROUP, mentorId: "" });

    expect(parsed).toMatchObject({ ok: true, value: { mentorId: null } });
  });

  it.each([
    { ...KEY, groupId: "", mentorId: OTHER },
    { ...KEY, groupId: GROUP, mentorId: "siapa saja" },
    { ...KEY, version: "", groupId: GROUP, mentorId: OTHER },
  ])("refuses what the tab would not send: %o", (sent) => {
    expect(parseMentorChoice(sent).ok).toBe(false);
  });
});

describe("parseMove", () => {
  it("reads the student and the group to move to", () => {
    const parsed = parseMove({ ...KEY, studentId: OTHER, toGroupId: GROUP });

    expect(parsed).toEqual({
      ok: true,
      value: {
        cohortYear: 2026,
        version: 3,
        studentId: OTHER,
        toGroupId: GROUP,
      },
    });
  });

  it.each([
    { ...KEY, studentId: "", toGroupId: GROUP },
    { ...KEY, studentId: OTHER, toGroupId: "" },
    { ...KEY, cohortYear: "", studentId: OTHER, toGroupId: GROUP },
  ])("refuses what the tab would not send: %o", (sent) => {
    expect(parseMove(sent).ok).toBe(false);
  });
});
