// Sample Tahun akademik of this file: those of the app's sample data.
import { and, eq, isNull } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { readRunningPeriod } from "@/academic-periods/stored-periods";
import {
  mentorGroupMembers,
  mentorGroupMentors,
  mentorGroups,
  mentoringAttendance,
  mentoringMeetingChanges,
  mentoringMeetings,
  students,
} from "./schema";
import { fillWithSampleData } from "./seed";
import { withTestDatabase } from "./test-database";

const inTestDatabase = withTestDatabase();

// Loading the whole sample set takes seconds when every check runs at
// once, and it waits behind other checks that write the same tables.
describe("the sample mentoring meetings", { timeout: 20_000 }, () => {
  it("are meetings 1 and 2 of the running period for every group that has a mentor", async () => {
    await inTestDatabase(async (db) => {
      await fillWithSampleData(db);

      const running = await readRunningPeriod(db);
      const held = await db
        .select({ groupId: mentorGroups.id })
        .from(mentorGroups)
        .innerJoin(
          mentorGroupMentors,
          and(
            eq(mentorGroupMentors.groupId, mentorGroups.id),
            isNull(mentorGroupMentors.endsOn),
          ),
        );
      const meetings = await db.select().from(mentoringMeetings);

      expect(held.length).toBeGreaterThan(0);
      for (const { groupId } of held) {
        const numbers = meetings
          .filter((meeting) => meeting.groupId === groupId)
          .map((meeting) => meeting.number)
          .sort();

        expect(numbers).toEqual([1, 2]);
      }
      for (const meeting of meetings) {
        expect(meeting.periodId).toBe(running?.id);
        expect(meeting.savedAt.getTime()).toBeLessThanOrEqual(Date.now());
      }
    });
  });

  it("mark only Aktif members of the meeting's group", async () => {
    await inTestDatabase(async (db) => {
      await fillWithSampleData(db);

      const marks = await db
        .select({
          meetingGroupId: mentoringMeetings.groupId,
          memberGroupId: mentorGroupMembers.groupId,
          status: students.status,
        })
        .from(mentoringAttendance)
        .innerJoin(
          mentoringMeetings,
          eq(mentoringMeetings.id, mentoringAttendance.meetingId),
        )
        .innerJoin(students, eq(students.id, mentoringAttendance.studentId))
        .leftJoin(
          mentorGroupMembers,
          eq(mentorGroupMembers.studentId, mentoringAttendance.studentId),
        );

      expect(marks.length).toBeGreaterThan(0);
      for (const mark of marks) {
        expect(mark.memberGroupId).toBe(mark.meetingGroupId);
        expect(mark.status).toBe("active");
      }
    });
  });

  it("each have one log line, with nothing before and the saved list after", async () => {
    await inTestDatabase(async (db) => {
      await fillWithSampleData(db);

      const meetings = await db.select().from(mentoringMeetings);
      const lines = await db.select().from(mentoringMeetingChanges);
      const marks = await db.select().from(mentoringAttendance);

      expect(lines).toHaveLength(meetings.length);
      for (const meeting of meetings) {
        const [line, ...more] = lines.filter(
          (each) => each.meetingId === meeting.id,
        );
        const saved = marks.filter((mark) => mark.meetingId === meeting.id);

        expect(more).toEqual([]);
        expect(line).toMatchObject({
          changedBy: meeting.savedBy,
          heldOnBefore: null,
          topicBefore: null,
          marksBefore: null,
          heldOnAfter: meeting.heldOn,
          topicAfter: meeting.topic,
        });
        expect(Object.keys(line?.marksAfter ?? {})).toHaveLength(saved.length);
        for (const mark of saved) {
          expect(line?.marksAfter[mark.studentId]).toBe(mark.mark);
        }
      }
    });
  });
});
