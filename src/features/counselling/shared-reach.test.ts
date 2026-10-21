// Sample NIMs of this file: 9986320000 to 9986320099.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { AccountForAccess } from "@/auth/access";
import { BAM_ROLES } from "@/auth/bam-roles";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { counsellingSharings, mentorGroupMentors, students } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { changeOwnSharing } from "./press-sharing";
import { recipientRolesOf, sharedReachOf } from "./shared-reach";
import { addTestActor } from "./test-consents";
import {
  addTestMentorOf,
  addTestRecipient,
  approveTestSharing,
  PUBLISHED_AT,
  publishTestSharing,
} from "./test-shared";
import { addSharingStudent } from "./test-sharings";

const inTestDatabase = withTestDatabase();

/** The students whose published sharing the account reaches. */
async function reachedBy(
  db: Database,
  actor: AccountForAccess,
): Promise<string[] | null> {
  const reach = sharedReachOf(actor);
  if (reach === null) return null;
  const rows = await db
    .select({ id: students.id })
    .from(counsellingSharings)
    .innerJoin(students, eq(students.id, counsellingSharings.studentId))
    .where(reach);
  return rows.map((row) => row.id);
}

describe("the recipient roles of an account", () => {
  it("are the roles it holds that may read shared data, in the order of the form", () => {
    const actor = {
      id: "x",
      roles: ["mentor", "student", "head_of_unit"] as RoleId[],
      studyProgramId: null,
      studentId: null,
    };
    expect(recipientRolesOf(actor)).toEqual(["head_of_unit", "mentor"]);
  });
});

describe("who reaches a published sharing", () => {
  it("reaches the student for Kepala Unit, Direktur, Ketua Program Studi of the program and the Pengasuh of today, when each is named", async () => {
    await inTestDatabase(async (db) => {
      const people = await addSharingStudent(
        db,
        "Prodi Uji Jangkauan 1",
        "9986320001",
      );
      const { mentor } = await addTestMentorOf(db, people.studentId);
      await publishTestSharing(db, people, {
        data: ["counselling"],
        recipients: ["head_of_unit", "director", "head_of_program", "mentor"],
      });
      for (const role of ["head_of_unit", "director", "head_of_program"]) {
        const actor = await addTestRecipient(
          db,
          [role as RoleId],
          people.studentId,
        );
        expect(await reachedBy(db, actor)).toEqual([people.studentId]);
      }
      expect(await reachedBy(db, mentor)).toEqual([people.studentId]);
    });
  });

  it("does not reach a student of another program for Ketua Program Studi, though named", async () => {
    await inTestDatabase(async (db) => {
      const people = await addSharingStudent(
        db,
        "Prodi Uji Jangkauan 2",
        "9986320002",
      );
      const other = await addSharingStudent(
        db,
        "Prodi Uji Jangkauan 3",
        "9986320003",
      );
      await publishTestSharing(db, people, {
        data: ["counselling"],
        recipients: ["head_of_program"],
      });
      const head = await addTestRecipient(
        db,
        ["head_of_program"],
        other.studentId,
      );
      expect(await reachedBy(db, head)).toEqual([]);
    });
  });

  it("does not reach a student who is no longer the Pengasuh's mentee, nor a mentee of another Pengasuh", async () => {
    await inTestDatabase(async (db) => {
      const people = await addSharingStudent(
        db,
        "Prodi Uji Jangkauan 4",
        "9986320004",
      );
      const { mentor, lineId } = await addTestMentorOf(db, people.studentId);
      await publishTestSharing(db, people, {
        data: ["counselling"],
        recipients: ["mentor"],
      });
      const stranger = await addTestActor(db, "Pengasuh Lain", ["mentor"]);
      expect(await reachedBy(db, stranger)).toEqual([]);
      expect(await reachedBy(db, mentor)).toEqual([people.studentId]);

      await db
        .update(mentorGroupMentors)
        .set({ endsOn: "2026-10-20", endReason: "Diganti" })
        .where(eq(mentorGroupMentors.id, lineId));
      expect(await reachedBy(db, mentor)).toEqual([]);
    });
  });

  it("does not reach a student for a role that is not named, also when another role of the account sees every student", async () => {
    await inTestDatabase(async (db) => {
      const people = await addSharingStudent(
        db,
        "Prodi Uji Jangkauan 5",
        "9986320005",
      );
      await publishTestSharing(db, people, {
        data: ["summary"],
        recipients: ["mentor"],
      });
      const head = await addTestRecipient(
        db,
        ["head_of_unit", "director", "head_of_program"],
        people.studentId,
      );
      expect(await reachedBy(db, head)).toEqual([]);
      const both = await addTestRecipient(
        db,
        ["mentor", "head_of_unit"],
        people.studentId,
      );
      expect(await reachedBy(db, both)).toEqual([]);
    });
  });

  it("reaches the student through any one named role whose rows hold the student, though another named role does not", async () => {
    await inTestDatabase(async (db) => {
      const people = await addSharingStudent(
        db,
        "Prodi Uji Jangkauan 9",
        "9986320009",
      );
      const elsewhere = await addSharingStudent(
        db,
        "Prodi Uji Jangkauan 10",
        "9986320010",
      );
      const { mentor } = await addTestMentorOf(db, people.studentId);
      await publishTestSharing(db, people, {
        data: ["counselling"],
        recipients: ["head_of_program", "mentor"],
      });
      const otherHead = await addTestRecipient(
        db,
        ["head_of_program"],
        elsewhere.studentId,
      );
      const both = {
        ...otherHead,
        id: mentor.id,
        roles: ["head_of_program", "mentor"] as RoleId[],
      };
      expect(await reachedBy(db, otherHead)).toEqual([]);
      expect(await reachedBy(db, both)).toEqual([people.studentId]);
    });
  });

  it("does not reach a sharing that is only approved, or one the student withdrew", async () => {
    await inTestDatabase(async (db) => {
      const people = await addSharingStudent(
        db,
        "Prodi Uji Jangkauan 6",
        "9986320006",
      );
      const approved = await approveTestSharing(db, people, {
        data: ["counselling"],
        recipients: ["head_of_unit"],
      });
      const head = await addTestRecipient(
        db,
        ["head_of_unit"],
        people.studentId,
      );
      expect(approved.status).toBe("approved");
      expect(await reachedBy(db, head)).toEqual([]);

      const other = await addSharingStudent(
        db,
        "Prodi Uji Jangkauan 7",
        "9986320007",
      );
      const published = await publishTestSharing(db, other, {
        data: ["counselling"],
        recipients: ["head_of_unit"],
      });
      expect(await reachedBy(db, head)).toEqual([other.studentId]);
      const [student] = other.students;
      if (!student) throw new Error("Student missing.");
      const withdrawn = await changeOwnSharing(
        db,
        student,
        "withdraw",
        published.id,
        published.version,
        new Date(PUBLISHED_AT.getTime() + 60_000),
      );
      expect(withdrawn.kind).toBe("kept");
      expect(await reachedBy(db, head)).toEqual([]);
    });
  });

  it("does not reach the account's own data", async () => {
    await inTestDatabase(async (db) => {
      const people = await addSharingStudent(
        db,
        "Prodi Uji Jangkauan 8",
        "9986320008",
      );
      await publishTestSharing(db, people, {
        data: ["counselling"],
        recipients: ["head_of_unit"],
      });
      const head = await addTestRecipient(
        db,
        ["head_of_unit"],
        people.studentId,
      );
      expect(
        await reachedBy(db, { ...head, studentId: people.studentId }),
      ).toEqual([]);
    });
  });

  it.each<RoleId>([
    "assessor",
    "upk_staff",
    "dorm_manager",
    ...BAM_ROLES,
    "counsellor",
    "discipline_officer",
    "student",
  ])("gives %s no reach at all", (role) => {
    const actor = {
      id: "x",
      roles: [role],
      studyProgramId: null,
      studentId: null,
    };
    expect(sharedReachOf(actor)).toBeNull();
    expect(recipientRolesOf(actor)).toEqual([]);
  });
});
