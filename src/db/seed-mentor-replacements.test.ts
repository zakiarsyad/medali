import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { campusDay } from "@/academic-periods/campus-day";
import { replacementStatus } from "@/features/mentor-groups/replacement-status";
import { SAMPLE_ACCOUNTS } from "./sample-data";
import {
  SAMPLE_REPLACEMENT,
  sampleReplacementDay,
} from "./sample-mentor-groups";
import { accounts, mentorGroupMentors, mentorReplacements } from "./schema";
import { fillWithSampleData } from "./seed";
import { withTestDatabase } from "./test-database";

const inTestDatabase = withTestDatabase();

// Loading the whole sample set takes seconds when every check runs at
// once, and it waits behind other checks that write the same tables.
describe("the sample mentor replacement", { timeout: 20_000 }, () => {
  it("is one, by the sample Kepala Unit, carried out, and leaves the old mentor Cadangan", async () => {
    await inTestDatabase(async (db) => {
      await fillWithSampleData(db);

      const replacements = await db
        .select({ replacement: mentorReplacements, setter: accounts.name })
        .from(mentorReplacements)
        .innerJoin(accounts, eq(accounts.id, mentorReplacements.setBy));

      expect(replacements).toHaveLength(1);
      const [found] = replacements;
      expect(found?.setter).toBe(SAMPLE_ACCOUNTS[0]?.name);
      expect(found?.replacement).toMatchObject({
        startsOn: sampleReplacementDay(campusDay()),
        reason: SAMPLE_REPLACEMENT.reason,
        oldMentorStatus: "reserve",
        cancelledAt: null,
        cancelledBy: null,
      });
      expect(found?.replacement.letterNumber).not.toBe("");
      expect(found && replacementStatus(found.replacement)).toBe("in_force");
      expect(found?.replacement.setAt.getTime()).toBeLessThanOrEqual(
        Date.now(),
      );
    });
  });

  it("agrees with the mentor lines of its group", async () => {
    await inTestDatabase(async (db) => {
      await fillWithSampleData(db);

      const [replacement] = await db.select().from(mentorReplacements);
      const lines = await db
        .select({ line: mentorGroupMentors, name: accounts.name })
        .from(mentorGroupMentors)
        .innerJoin(accounts, eq(accounts.id, mentorGroupMentors.mentorId))
        .where(eq(mentorGroupMentors.groupId, replacement?.groupId ?? ""));
      const ended = lines.filter(({ line }) => line.endsOn !== null);
      const current = lines.filter(({ line }) => line.endsOn === null);

      expect(lines).toHaveLength(2);
      expect(ended[0]?.name).toBe(SAMPLE_REPLACEMENT.oldMentor);
      expect(ended[0]?.line).toMatchObject({
        mentorId: replacement?.oldMentorId,
        endsOn: replacement?.startsOn,
        endReason: "Permintaan sendiri",
      });
      expect(current[0]?.name).toBe(SAMPLE_REPLACEMENT.newMentor);
      expect(current[0]?.line).toMatchObject({
        mentorId: replacement?.newMentorId,
        startsOn: replacement?.startsOn,
      });
    });
  });

  it("leaves the old mentor without a group", async () => {
    await inTestDatabase(async (db) => {
      await fillWithSampleData(db);

      const [replacement] = await db.select().from(mentorReplacements);
      const held = await db
        .select()
        .from(mentorGroupMentors)
        .where(eq(mentorGroupMentors.mentorId, replacement?.oldMentorId ?? ""));

      expect(held).toHaveLength(1);
      expect(held[0]?.endsOn).not.toBe(null);
    });
  });
});
