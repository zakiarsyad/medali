import { describe, expect, it } from "vitest";
import { SAMPLE_ACCOUNTS, SAMPLE_STUDENTS } from "./sample-data";
import {
  isGroupOf,
  SAMPLE_MENTOR_OF_NEWEST_ONLY,
  SAMPLE_MENTORS_WITHOUT_GROUP,
  SAMPLE_REPLACED_GROUP,
  SAMPLE_REPLACEMENT,
  type SampleMentorGroup,
  sampleGroupHolders,
  sampleMentorGroups,
  sampleReplacementDay,
} from "./sample-mentor-groups";
import { sampleGroupedFirstYears } from "./sample-new-intake";

const FIRST_YEAR = 2026;
const DAY = "2026-10-13";
const everyone = [...SAMPLE_STUDENTS, ...sampleGroupedFirstYears(FIRST_YEAR)];
const groups = sampleMentorGroups(everyone, DAY);

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

describe("sampleReplacementDay", () => {
  it("is 30 days before the day", () => {
    expect(sampleReplacementDay("2026-10-13")).toBe("2026-09-13");
  });

  it("stays within the calendar year of the day", () => {
    expect(sampleReplacementDay("2027-01-20")).toBe("2027-01-01");
    expect(sampleReplacementDay("2027-01-01")).toBe("2027-01-01");
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

  it("gives every holder a group of today, and none to the two without one", () => {
    const current = new Set(groups.map(currentMentor));
    expect([...current].sort()).toEqual(sampleGroupHolders().sort());
    for (const name of SAMPLE_MENTORS_WITHOUT_GROUP) {
      expect(current.has(name)).toBe(false);
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

  it("has two groups with an earlier mentor, who ended with a reason", () => {
    const replaced = groups.filter((group) => group.mentors.length > 1);
    expect(replaced).toHaveLength(2);
    for (const group of replaced) {
      const [earlier, current] = group.mentors;
      expect(group.mentors).toHaveLength(2);
      expect(earlier?.endReason).toBeTruthy();
      expect(current?.name).not.toBe(earlier?.name);
    }
  });

  it("has one of them from before replacements were kept as records", () => {
    const group = groups.find((each) => isGroupOf(each, SAMPLE_REPLACED_GROUP));
    const [earlier, current] = group?.mentors ?? [];
    expect(earlier?.endsOn).toBe(SAMPLE_REPLACED_GROUP.endsOn);
    expect(earlier?.endReason).toBe(SAMPLE_REPLACED_GROUP.endReason);
    expect(current?.startsOn).toBe(SAMPLE_REPLACED_GROUP.replacedOn);
  });

  it("has the other from the sample replacement, the old mentor ending the day the new one starts", () => {
    const group = groups.find((each) => isGroupOf(each, SAMPLE_REPLACEMENT));
    const [earlier, current] = group?.mentors ?? [];
    expect(earlier).toEqual({
      name: SAMPLE_REPLACEMENT.oldMentor,
      startsOn: group?.startsOn,
      endsOn: "2026-09-13",
      endReason: "Permintaan sendiri",
    });
    expect(current).toEqual({
      name: SAMPLE_REPLACEMENT.newMentor,
      startsOn: "2026-09-13",
      endsOn: null,
      endReason: null,
    });
  });

  it("gives the old mentor of the sample replacement no other group, and the new one a spare mentor's jurusan", () => {
    const { oldMentor, newMentor } = SAMPLE_REPLACEMENT;
    const held = groups.filter((group) =>
      group.mentors.some((mentor) => mentor.name === oldMentor),
    );
    const unitOf = (name: string) =>
      SAMPLE_ACCOUNTS.find((account) => account.name === name)?.unit;

    expect(held).toHaveLength(1);
    expect(SAMPLE_MENTORS_WITHOUT_GROUP).toContain(oldMentor);
    expect(unitOf(newMentor)).toBe(unitOf(oldMentor));
    expect(unitOf(newMentor)).toBeTruthy();
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
