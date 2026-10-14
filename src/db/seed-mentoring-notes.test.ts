// Sample Tahun akademik of this file: those of the app's sample data.
import { and, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { SAMPLE_NOTE_BY_EARLIER_MENTOR } from "./sample-mentoring-notes";
import {
  accounts,
  mentorGroupMembers,
  mentorGroupMentors,
  mentoringNotes,
} from "./schema";
import { fillWithSampleData } from "./seed";
import { withTestDatabase } from "./test-database";

const inTestDatabase = withTestDatabase();

// Loading the whole sample set takes seconds when every check runs at
// once, and it waits behind other checks that write the same tables.
describe("the sample mentoring notes", { timeout: 20_000 }, () => {
  it("are each about a member of a group its writer held on that day", async () => {
    await inTestDatabase(async (db) => {
      await fillWithSampleData(db);

      const notes = await db.select().from(mentoringNotes);
      const lines = await db
        .select({
          studentId: mentorGroupMembers.studentId,
          mentorId: mentorGroupMentors.mentorId,
          startsOn: mentorGroupMentors.startsOn,
          endsOn: mentorGroupMentors.endsOn,
        })
        .from(mentorGroupMembers)
        .innerJoin(
          mentorGroupMentors,
          eq(mentorGroupMentors.groupId, mentorGroupMembers.groupId),
        );

      expect(notes.length).toBeGreaterThanOrEqual(6);
      for (const note of notes) {
        const held = lines.some((line) => {
          const isTheirs =
            line.studentId === note.studentId &&
            line.mentorId === note.writtenBy;
          const hasEnded =
            line.endsOn !== null && line.endsOn < note.happenedOn;
          return isTheirs && line.startsOn <= note.happenedOn && !hasEnded;
        });
        expect(held).toBe(true);
        expect(note.writtenAt.getTime()).toBeLessThanOrEqual(Date.now());
      }
    });
  });

  it("keep the earlier mentor as the writer of the note written before the replacement", async () => {
    await inTestDatabase(async (db) => {
      await fillWithSampleData(db);

      const [old] = await db
        .select({
          studentId: mentoringNotes.studentId,
          writtenBy: mentoringNotes.writtenBy,
          writer: accounts.name,
        })
        .from(mentoringNotes)
        .innerJoin(accounts, eq(accounts.id, mentoringNotes.writtenBy))
        .where(
          eq(
            mentoringNotes.happenedOn,
            SAMPLE_NOTE_BY_EARLIER_MENTOR.happenedOn,
          ),
        );
      if (!old) throw new Error("The note of the earlier mentor is missing.");
      const [line] = await db
        .select({ endsOn: mentorGroupMentors.endsOn })
        .from(mentorGroupMembers)
        .innerJoin(
          mentorGroupMentors,
          eq(mentorGroupMentors.groupId, mentorGroupMembers.groupId),
        )
        .where(
          and(
            eq(mentorGroupMembers.studentId, old.studentId),
            eq(mentorGroupMentors.mentorId, old.writtenBy),
          ),
        );

      expect(line?.endsOn).not.toBeNull();
    });
  });
});
