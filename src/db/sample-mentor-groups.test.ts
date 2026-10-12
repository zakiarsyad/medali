import { describe, expect, it } from "vitest";
import { SAMPLE_ACCOUNTS, SAMPLE_STUDENTS } from "./sample-data";
import {
  SAMPLE_MENTOR_OF_NEWEST_ONLY,
  SAMPLE_MENTORS_WITHOUT_GROUP,
  SAMPLE_REPLACED_GROUP,
  type SampleMentorGroup,
  sampleGroupHolders,
  sampleMentorGroups,
} from "./sample-mentor-groups";
import { sampleGroupedFirstYears } from "./sample-new-intake";

const FIRST_YEAR = 2026;
const everyone = [...SAMPLE_STUDENTS, ...sampleGroupedFirstYears(FIRST_YEAR)];
const groups = sampleMentorGroups(everyone);

const mentorNames = SAMPLE_ACCOUNTS.filter((account) =>
  account.roles.includes("mentor"),
).map((account) => account.name);

function currentMentor(group: SampleMentorGroup): string | undefined {
  return group.mentors.at(-1)?.name;
}

function isLarge(group: SampleMentorGroup): boolean {
  return group.memberNims.length >= 25 && group.memberNims.length <= 35;
}

describe("the sample Pengasuh", () => {
  it("are made-up staff with a gelar and a unit, each with their own name", () => {
    const names = SAMPLE_ACCOUNTS.map((account) => account.name);
    expect(new Set(names).size).toBe(names.length);
    for (const account of SAMPLE_ACCOUNTS) {
      if (!account.roles.includes("mentor")) continue;
      expect(account.title).not.toBe("");
      expect(account.unit).not.toBe("");
    }
  });

  it("are two without a group and several who hold groups", () => {
    expect(SAMPLE_MENTORS_WITHOUT_GROUP).toHaveLength(2);
    for (const name of SAMPLE_MENTORS_WITHOUT_GROUP) {
      expect(mentorNames).toContain(name);
    }
    const holders = sampleGroupHolders();
    expect(holders.length).toBeGreaterThanOrEqual(3);
    expect(holders.length + 2).toBe(mentorNames.length);
  });
});

describe("sampleMentorGroups", () => {
  it("puts every sample student into one group of their angkatan, program studi and jalur", () => {
    const placed = groups.flatMap((group) => group.memberNims);
    expect([...placed].sort()).toEqual(everyone.map((s) => s.nim).sort());

    for (const group of groups) {
      for (const nim of group.memberNims) {
        const student = everyone.find((one) => one.nim === nim);
        expect(student).toMatchObject({
          studyProgram: group.studyProgram,
          cohortYear: group.cohortYear,
          entryPath: group.entryPath,
        });
      }
    }
  });

  it("uses each program studi, angkatan, jalur and number once", () => {
    const keys = groups.map(
      (g) => `${g.studyProgram} ${g.cohortYear} ${g.entryPath} ${g.number}`,
    );
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("starts each group on 1 September of its angkatan, with its first mentor", () => {
    for (const group of groups) {
      expect(group.startsOn).toBe(`${group.cohortYear}-09-01`);
      expect(group.mentors[0]?.startsOn).toBe(group.startsOn);
    }
  });

  it("makes at least two groups of 25 to 35 and smaller ones for the rest", () => {
    const large = groups.filter(isLarge);
    expect(large.length).toBeGreaterThanOrEqual(2);
    const small = groups.filter((group) => group.memberNims.length < 25);
    expect(small.length).toBeGreaterThan(0);
    expect(large.length + small.length).toBe(groups.length);
  });

  it("gives every group one mentor of today, who is a sample Pengasuh", () => {
    for (const group of groups) {
      const current = group.mentors.filter((mentor) => mentor.endsOn === null);
      expect(current).toHaveLength(1);
      expect(group.mentors.at(-1)?.endsOn).toBe(null);
      for (const mentor of group.mentors) {
        expect(mentorNames).toContain(mentor.name);
      }
    }
  });

  it("gives every holder a group, and none to the two without one", () => {
    const holding = new Set(
      groups.flatMap((g) => g.mentors.map((m) => m.name)),
    );
    const current = new Set(groups.map(currentMentor));
    expect([...current].sort()).toEqual(sampleGroupHolders().sort());
    for (const name of SAMPLE_MENTORS_WITHOUT_GROUP) {
      expect(holding.has(name)).toBe(false);
    }
  });

  it("gives one Pengasuh a group of the newest angkatan and no other", () => {
    const { name, studyProgram } = SAMPLE_MENTOR_OF_NEWEST_ONLY;
    const held = groups.filter((group) =>
      group.mentors.some((mentor) => mentor.name === name),
    );
    expect(held).toHaveLength(1);
    expect(held[0]).toMatchObject({ cohortYear: FIRST_YEAR, studyProgram });
  });

  it("gives Hendra Wijaya one of the large groups", () => {
    const held = groups.filter((g) => currentMentor(g) === "Hendra Wijaya");
    expect(held.some(isLarge)).toBe(true);
  });

  it("has one group with an earlier mentor, who ended with a reason", () => {
    const replaced = groups.filter((group) => group.mentors.length > 1);
    expect(replaced).toHaveLength(1);
    expect(replaced[0]).toMatchObject({
      studyProgram: SAMPLE_REPLACED_GROUP.studyProgram,
      cohortYear: SAMPLE_REPLACED_GROUP.cohortYear,
      entryPath: SAMPLE_REPLACED_GROUP.entryPath,
    });
    const [earlier, current] = replaced[0]?.mentors ?? [];
    expect(earlier?.endsOn).toBe(SAMPLE_REPLACED_GROUP.endsOn);
    expect(earlier?.endReason).toBe(SAMPLE_REPLACED_GROUP.endReason);
    expect(current?.startsOn).toBe(SAMPLE_REPLACED_GROUP.replacedOn);
    expect(current?.name).not.toBe(earlier?.name);
  });

  it("has a group with a member on Cuti", () => {
    const onLeave = everyone
      .filter((student) => student.status === "on_leave")
      .map((student) => student.nim);
    expect(onLeave.length).toBeGreaterThan(0);
    const withLeave = groups.filter((group) =>
      group.memberNims.some((nim) => onLeave.includes(nim)),
    );
    expect(withLeave.length).toBeGreaterThan(0);
  });
});
