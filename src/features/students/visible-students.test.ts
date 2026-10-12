import { describe, expect, it } from "vitest";
import { type AccountForAccess, mayOpenPage, rowLimitFor } from "@/auth/access";
import { ROLE_IDS, type RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { students } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import {
  addTestActor,
  addTestMentorGroup,
  addTestProgram,
  addTestStudent,
} from "./test-records";
import { visibleTo } from "./visible-students";

const inTestDatabase = withTestDatabase();

/** How the NIMs of these checks start, to tell them from other rows. */
const TEST_NIMS = "99000003";

const MAY_OPEN: RoleId[] = ["head_of_unit", "director", "head_of_program"];

function account(
  roles: RoleId[],
  more: Partial<AccountForAccess> = {},
): AccountForAccess {
  const id = "00000000-0000-4000-8000-000000000001";
  return { id, roles, studyProgramId: null, studentId: null, ...more };
}

interface TestRows {
  ownProgram: number;
  ownId: string;
}

/** Two programs with one student each, and one removed student. */
async function addTestRows(db: Database): Promise<TestRows> {
  const ownProgram = await addTestProgram(db, "Prodi Uji Sendiri");
  const otherProgram = await addTestProgram(db, "Prodi Uji Lain");
  const ownId = await addTestStudent(db, ownProgram, {
    nim: "9900000301",
    name: "Tampak Uji Sendiri",
  });
  await addTestStudent(db, otherProgram, {
    nim: "9900000302",
    name: "Tampak Uji Lain",
  });
  await addTestStudent(db, ownProgram, {
    nim: "9900000303",
    name: "Tampak Uji Dihapus",
    deletedAt: new Date("2026-10-11T03:00:00Z"),
  });
  return { ownProgram, ownId };
}

const OTHER_MENTOR_NIM = "9900000313";
const HELD_BEFORE_NIM = "9900000314";
const REMOVED_MEMBER_NIM = "9900000315";
const NO_GROUP_NIM = "9900000316";

interface MentorRows {
  mentorId: string;
  otherMentorId: string;
  ownProgram: number;
}

/**
 * A Pengasuh who holds a group in each of two programs, and another who
 * holds two groups of the first program, one of them taken over from the
 * first Pengasuh. One member is removed and one student has no group.
 */
async function addMentorRows(db: Database): Promise<MentorRows> {
  const ownProgram = await addTestProgram(db, "Prodi Uji Asuh Sendiri");
  const otherProgram = await addTestProgram(db, "Prodi Uji Asuh Lain");
  const mentor = await addTestActor(db, "Pengasuh Uji Sendiri", ["mentor"]);
  const other = await addTestActor(db, "Pengasuh Uji Lain", ["mentor"]);
  const add = (programId: number, nim: string, removed = false) =>
    addTestStudent(db, programId, {
      nim,
      name: `Asuhan Uji ${nim}`,
      deletedAt: removed ? new Date("2026-10-11T03:00:00Z") : null,
    });

  await addTestMentorGroup(db, ownProgram, {
    number: 1,
    memberIds: [
      await add(ownProgram, "9900000311"),
      await add(ownProgram, REMOVED_MEMBER_NIM, true),
    ],
    mentorId: mentor.id,
  });
  await addTestMentorGroup(db, otherProgram, {
    number: 1,
    memberIds: [await add(otherProgram, "9900000312")],
    mentorId: mentor.id,
  });
  await addTestMentorGroup(db, ownProgram, {
    number: 2,
    memberIds: [await add(ownProgram, OTHER_MENTOR_NIM)],
    mentorId: other.id,
  });
  await addTestMentorGroup(db, ownProgram, {
    number: 3,
    memberIds: [await add(ownProgram, HELD_BEFORE_NIM)],
    mentorId: other.id,
    earlierMentorId: mentor.id,
  });
  await add(otherProgram, NO_GROUP_NIM);
  return { mentorId: mentor.id, otherMentorId: other.id, ownProgram };
}

async function nimsSeenBy(
  db: Database,
  viewer: AccountForAccess,
): Promise<string[]> {
  const rows = await db
    .select({ nim: students.nim })
    .from(students)
    .where(visibleTo(rowLimitFor(viewer)));
  const nims = rows.map((row) => row.nim);
  return nims.filter((nim) => nim.startsWith(TEST_NIMS)).sort();
}

describe("the Mahasiswa page", () => {
  it.each(MAY_OPEN)("opens for %s", (role) => {
    expect(mayOpenPage([role], "students")).toBe(true);
  });

  it("is refused to every other role", () => {
    const others = ROLE_IDS.filter((role) => !MAY_OPEN.includes(role));
    expect(others.length).toBeGreaterThan(0);
    for (const role of others) {
      expect(mayOpenPage([role], "students")).toBe(false);
    }
  });
});

describe("visibleTo", () => {
  it.each(["head_of_unit", "director"] as const)(
    "shows %s every student that is not removed",
    async (role) => {
      await inTestDatabase(async (db) => {
        await addTestRows(db);

        expect(await nimsSeenBy(db, account([role]))).toEqual([
          "9900000301",
          "9900000302",
        ]);
      });
    },
  );

  it("shows Ketua Program Studi only their own program studi", async () => {
    await inTestDatabase(async (db) => {
      const { ownProgram } = await addTestRows(db);
      const head = account(["head_of_program"], { studyProgramId: ownProgram });

      expect(await nimsSeenBy(db, head)).toEqual(["9900000301"]);
    });
  });

  it("shows nobody to Ketua Program Studi without a program studi", async () => {
    await inTestDatabase(async (db) => {
      await addTestRows(db);

      expect(await nimsSeenBy(db, account(["head_of_program"]))).toEqual([]);
    });
  });

  it("shows a student only themselves", async () => {
    await inTestDatabase(async (db) => {
      const { ownId } = await addTestRows(db);
      const student = account(["student"], { studentId: ownId });

      expect(await nimsSeenBy(db, student)).toEqual(["9900000301"]);
    });
  });

  it("shows Pengasuh the members of the groups they hold today", async () => {
    await inTestDatabase(async (db) => {
      const { mentorId } = await addMentorRows(db);

      expect(
        await nimsSeenBy(db, account(["mentor"], { id: mentorId })),
      ).toEqual(["9900000311", "9900000312"]);
    });
  });

  it("hides from Pengasuh the members of a group they held before", async () => {
    await inTestDatabase(async (db) => {
      const { mentorId } = await addMentorRows(db);

      const seen = await nimsSeenBy(db, account(["mentor"], { id: mentorId }));
      expect(seen).not.toContain(HELD_BEFORE_NIM);
    });
  });

  it("hides from Pengasuh the group of another Pengasuh, a student in no group and a removed member", async () => {
    await inTestDatabase(async (db) => {
      const { mentorId, otherMentorId } = await addMentorRows(db);
      const mentor = account(["mentor"], { id: mentorId });
      const other = account(["mentor"], { id: otherMentorId });

      const seen = await nimsSeenBy(db, mentor);
      expect(seen).not.toContain(OTHER_MENTOR_NIM);
      expect(seen).not.toContain(NO_GROUP_NIM);
      expect(seen).not.toContain(REMOVED_MEMBER_NIM);
      expect(await nimsSeenBy(db, other)).toEqual([
        OTHER_MENTOR_NIM,
        HELD_BEFORE_NIM,
      ]);
    });
  });

  it("shows nobody to Pengasuh who holds no group", async () => {
    await inTestDatabase(async (db) => {
      await addMentorRows(db);
      const idle = await addTestActor(db, "Pengasuh Uji Tanpa Kelompok", [
        "mentor",
      ]);

      expect(
        await nimsSeenBy(db, account(["mentor"], { id: idle.id })),
      ).toEqual([]);
    });
  });

  it("shows Pengasuh who is also Ketua Program Studi their groups and their program studi", async () => {
    await inTestDatabase(async (db) => {
      const { mentorId, ownProgram } = await addMentorRows(db);
      const both = account(["mentor", "head_of_program"], {
        id: mentorId,
        studyProgramId: ownProgram,
      });

      expect(await nimsSeenBy(db, both)).toEqual([
        "9900000311",
        "9900000312",
        OTHER_MENTOR_NIM,
        HELD_BEFORE_NIM,
      ]);
    });
  });
});
