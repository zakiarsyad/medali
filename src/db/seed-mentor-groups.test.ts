import { count, eq, isNotNull, isNull } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { groupCode } from "@/features/mentor-groups/group-code";
import type { Database } from "./connect";
import {
  SAMPLE_MENTORS_WITHOUT_GROUP,
  SAMPLE_REPLACED_GROUP,
} from "./sample-mentor-groups";
import {
  accountRoles,
  accounts,
  mentorGroupMembers,
  mentorGroupMentors,
  mentorGroups,
  students,
  studyPrograms,
} from "./schema";
import { fillWithSampleData } from "./seed";
import { withTestDatabase } from "./test-database";

const inTestDatabase = withTestDatabase();

interface HeldGroup {
  code: string;
  members: number;
  mentor: string;
}

/** Every group with its code, its size and its mentor of today. */
async function heldGroups(db: Database): Promise<HeldGroup[]> {
  const rows = await db
    .select({
      cohortYear: mentorGroups.cohortYear,
      entryPath: mentorGroups.entryPath,
      number: mentorGroups.number,
      programCode: studyPrograms.code,
      mentor: accounts.name,
      members: count(mentorGroupMembers.studentId),
    })
    .from(mentorGroups)
    .innerJoin(studyPrograms, eq(studyPrograms.id, mentorGroups.studyProgramId))
    .innerJoin(
      mentorGroupMentors,
      eq(mentorGroupMentors.groupId, mentorGroups.id),
    )
    .innerJoin(accounts, eq(accounts.id, mentorGroupMentors.mentorId))
    .leftJoin(
      mentorGroupMembers,
      eq(mentorGroupMembers.groupId, mentorGroups.id),
    )
    .where(isNull(mentorGroupMentors.endsOn))
    .groupBy(mentorGroups.id, studyPrograms.code, accounts.name);
  return rows.map(({ mentor, members, ...group }) => ({
    code: groupCode(group),
    members,
    mentor,
  }));
}

async function mentorAccountNames(db: Database): Promise<string[]> {
  const rows = await db
    .select({ name: accounts.name })
    .from(accountRoles)
    .innerJoin(accounts, eq(accounts.id, accountRoles.accountId))
    .where(eq(accountRoles.role, "mentor"));
  return rows.map((row) => row.name);
}

function isLarge(group: HeldGroup): boolean {
  return group.members >= 25 && group.members <= 35;
}

// Loading the whole sample set takes seconds when every check runs at
// once, and it waits behind other checks that write the same tables.
describe("the sample mentor groups", { timeout: 20_000 }, () => {
  it("put every sample student into a group that has a mentor of today", async () => {
    await inTestDatabase(async (db) => {
      await fillWithSampleData(db);

      const groups = await heldGroups(db);
      const [all] = await db.select({ groups: count() }).from(mentorGroups);
      expect(groups).toHaveLength(all?.groups ?? 0);
      const codes = groups.map((group) => group.code);
      expect(new Set(codes).size).toBe(codes.length);
      expect(codes).toContain("KP 24-D3PJK-01");
      expect(codes).toContain("KP 24-ASP-AJ-01");

      const [added] = await db.select({ students: count() }).from(students);
      const placed = groups.reduce((sum, group) => sum + group.members, 0);
      expect(placed).toBeGreaterThan(0);
      expect(placed).toBe(added?.students);
    });
  });

  it("make at least two groups of 25 to 35, one of them held by Hendra Wijaya, and smaller ones", async () => {
    await inTestDatabase(async (db) => {
      await fillWithSampleData(db);

      const groups = await heldGroups(db);
      const large = groups.filter(isLarge);
      expect(large.length).toBeGreaterThanOrEqual(2);
      expect(large.map((group) => group.mentor)).toContain("Hendra Wijaya");
      const small = groups.filter((group) => group.members < 25);
      expect(small.length).toBeGreaterThan(0);
      for (const group of small) {
        expect(group.members).toBeGreaterThan(0);
      }
    });
  });

  it("leave exactly two sample Pengasuh without a group, and several with one", async () => {
    await inTestDatabase(async (db) => {
      await fillWithSampleData(db);

      const lines = await db
        .select({ name: accounts.name })
        .from(mentorGroupMentors)
        .innerJoin(accounts, eq(accounts.id, mentorGroupMentors.mentorId));
      const everHeld = new Set(lines.map((line) => line.name));
      const holding = new Set((await heldGroups(db)).map((g) => g.mentor));
      const mentors = await mentorAccountNames(db);

      const without = mentors.filter((name) => !everHeld.has(name));
      expect(without.sort()).toEqual([...SAMPLE_MENTORS_WITHOUT_GROUP].sort());
      expect(holding.size).toBeGreaterThanOrEqual(3);
      for (const name of holding) {
        expect(mentors).toContain(name);
      }
    });
  });

  it("keep one group with an earlier mentor, who ended with a reason", async () => {
    await inTestDatabase(async (db) => {
      await fillWithSampleData(db);

      const ended = await db
        .select({
          groupId: mentorGroupMentors.groupId,
          mentorId: mentorGroupMentors.mentorId,
          startsOn: mentorGroupMentors.startsOn,
          endsOn: mentorGroupMentors.endsOn,
          endReason: mentorGroupMentors.endReason,
          groupStartsOn: mentorGroups.startsOn,
        })
        .from(mentorGroupMentors)
        .innerJoin(
          mentorGroups,
          eq(mentorGroups.id, mentorGroupMentors.groupId),
        )
        .where(isNotNull(mentorGroupMentors.endsOn));
      expect(ended).toHaveLength(1);
      const [earlier] = ended;
      expect(earlier?.startsOn).toBe(earlier?.groupStartsOn);
      expect(earlier?.endsOn).toBe(SAMPLE_REPLACED_GROUP.endsOn);
      expect(earlier?.endReason).toBe(SAMPLE_REPLACED_GROUP.endReason);

      const lines = await db
        .select()
        .from(mentorGroupMentors)
        .where(eq(mentorGroupMentors.groupId, earlier?.groupId ?? ""));
      const current = lines.filter((line) => line.endsOn === null);
      expect(current).toHaveLength(1);
      expect(current[0]?.mentorId).not.toBe(earlier?.mentorId);
      expect(current[0]?.startsOn).toBe(SAMPLE_REPLACED_GROUP.replacedOn);
    });
  });

  it("keep the students on Cuti and Non aktif in their groups", async () => {
    await inTestDatabase(async (db) => {
      await fillWithSampleData(db);

      const members = await db
        .select({ status: students.status })
        .from(mentorGroupMembers)
        .innerJoin(students, eq(students.id, mentorGroupMembers.studentId));
      const statuses = members.map((member) => member.status);
      expect(statuses).toContain("on_leave");
      expect(statuses).toContain("inactive");
    });
  });
});
