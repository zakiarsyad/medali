import { describe, expect, it } from "vitest";
import { daysBefore } from "@/academic-periods/days-before";
import { SAMPLE_STUDENTS } from "./sample-data";
import {
  SAMPLE_REPLACED_GROUP,
  type SampleMentorGroup,
  sampleMentorGroups,
} from "./sample-mentor-groups";
import {
  SAMPLE_NOTE_BY_EARLIER_MENTOR,
  sampleMentoringNotes,
} from "./sample-mentoring-notes";
import { sampleGroupedFirstYears } from "./sample-new-intake";
import { mentoringNoteKind } from "./schema";

const DAY = "2026-10-13";
const students = [...SAMPLE_STUDENTS, ...sampleGroupedFirstYears(2026)];
const groups = sampleMentorGroups(students, DAY);
const notes = sampleMentoringNotes(groups, students, DAY);

function groupOf(nim: string): SampleMentorGroup {
  const group = groups.find((each) => each.memberNims.includes(nim));
  if (!group) throw new Error(`The sample NIM ${nim} is in no group.`);
  return group;
}

function heldOn(group: SampleMentorGroup, name: string, day: string): boolean {
  return group.mentors.some((mentor) => {
    const hasEnded = mentor.endsOn !== null && mentor.endsOn < day;
    return mentor.name === name && mentor.startsOn <= day && !hasEnded;
  });
}

describe("sampleMentoringNotes", () => {
  it("has a note for every sample group that has an Aktif member", () => {
    const noted = new Set(notes.map((note) => groupOf(note.nim)));
    const active = new Set(
      students
        .filter((student) => (student.status ?? "active") === "active")
        .map((student) => student.nim),
    );
    const withActive = groups.filter((group) =>
      group.memberNims.some((nim) => active.has(nim)),
    );

    expect(withActive.length).toBeGreaterThan(0);
    for (const group of withActive) expect(noted).toContain(group);
  });

  it("is only about Aktif sample students", () => {
    for (const note of notes) {
      const student = students.find((each) => each.nim === note.nim);

      expect(student).toBeDefined();
      expect(student?.status ?? "active").toBe("active");
    }
  });

  it("is written by the mentor who held the student's group on that day", () => {
    for (const note of notes) {
      const held = heldOn(groupOf(note.nim), note.writer, note.happenedOn);

      expect(held).toBe(true);
    }
  });

  it("has no note after today", () => {
    for (const note of notes) {
      expect(note.happenedOn <= DAY).toBe(true);
    }
  });

  it("has notes of every kind, some of them in the last 90 days", () => {
    const kinds = new Set(notes.map((note) => note.kind));
    const recent = notes.filter(
      (note) => note.happenedOn > daysBefore(DAY, 90),
    );

    expect([...kinds].sort()).toEqual([...mentoringNoteKind.enumValues].sort());
    expect(recent.length).toBeGreaterThan(0);
  });

  it("has a text of 5 letters or more in every note", () => {
    for (const note of notes) {
      expect(note.note.trim().length).toBeGreaterThanOrEqual(5);
    }
  });

  it("has a note by the earlier mentor of the group whose mentor was replaced", () => {
    const old = notes.filter(
      (note) => note.happenedOn === SAMPLE_NOTE_BY_EARLIER_MENTOR.happenedOn,
    );

    expect(old).toHaveLength(1);
    const group = groupOf(old[0]?.nim ?? "");
    expect(group.studyProgram).toBe(SAMPLE_REPLACED_GROUP.studyProgram);
    expect(group.mentors.at(-1)?.name).not.toBe(old[0]?.writer);
    expect(group.mentors[0]?.name).toBe(old[0]?.writer);
  });

  it("is empty without groups", () => {
    expect(sampleMentoringNotes([], students, DAY)).toEqual([]);
  });
});
