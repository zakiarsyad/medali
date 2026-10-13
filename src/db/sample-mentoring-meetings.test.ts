import { describe, expect, it } from "vitest";
import { SAMPLE_STUDENTS, samplePeriods } from "./sample-data";
import { sampleMentorGroups } from "./sample-mentor-groups";
import { sampleMentoringMeetings } from "./sample-mentoring-meetings";
import { sampleGroupedFirstYears } from "./sample-new-intake";

const DAY = "2026-10-13";
const BEFORE_NEW_GROUPS = "2026-08-15";
const [period] = samplePeriods(DAY);
if (!period) throw new Error("There are no sample periods.");
const students = [...SAMPLE_STUDENTS, ...sampleGroupedFirstYears(2026)];
const groups = sampleMentorGroups(students);
const meetings = sampleMentoringMeetings(groups, students, period, DAY);

function statusOf(nim: string): string {
  const student = students.find((each) => each.nim === nim);
  if (!student) throw new Error(`The sample NIM ${nim} is missing.`);
  return student.status ?? "active";
}

describe("sampleMentoringMeetings", () => {
  it("has meetings 1 and 2 for every sample group", () => {
    expect(groups.length).toBeGreaterThan(0);
    for (const group of groups) {
      const numbers = meetings
        .filter((meeting) => meeting.group === group)
        .map((meeting) => meeting.number);

      expect(numbers).toEqual([1, 2]);
    }
  });

  it("holds each meeting inside the running period, today at the latest", () => {
    for (const meeting of meetings) {
      expect(meeting.heldOn >= period.startsOn).toBe(true);
      expect(meeting.heldOn <= period.endsOn).toBe(true);
      expect(meeting.heldOn <= DAY).toBe(true);
    }
  });

  it("is filled in by the mentor who held the group on that day", () => {
    for (const meeting of meetings) {
      const holder = meeting.group.mentors.find((mentor) => {
        const hasEnded =
          mentor.endsOn !== null && mentor.endsOn < meeting.heldOn;
        return mentor.startsOn <= meeting.heldOn && !hasEnded;
      });

      expect(holder?.name).toBe(meeting.savedBy);
    }
  });

  it("marks every Aktif member of the group once, and nobody else", () => {
    const onLeave = students.filter((student) => student.status === "on_leave");

    expect(onLeave.length).toBeGreaterThan(0);
    for (const meeting of meetings) {
      const active = meeting.group.memberNims.filter(
        (nim) => statusOf(nim) === "active",
      );

      expect(meeting.marks.map((mark) => mark.nim)).toEqual(active);
    }
  });

  it("has members who came and members who were away for each reason", () => {
    const marks = new Set(
      meetings.flatMap((meeting) => meeting.marks.map((mark) => mark.mark)),
    );

    expect(marks).toEqual(new Set(["present", "excused", "sick", "absent"]));
  });

  it("gives a group whose first mentor comes after today no meeting", () => {
    const early = sampleMentoringMeetings(
      groups,
      students,
      period,
      BEFORE_NEW_GROUPS,
    );
    const started = groups.filter(
      (group) => group.startsOn <= BEFORE_NEW_GROUPS,
    );

    expect(started.length).toBeLessThan(groups.length);
    expect(new Set(early.map((meeting) => meeting.group))).toEqual(
      new Set(started),
    );
  });
});
