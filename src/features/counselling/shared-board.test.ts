// Sample NIMs of this file: 9986321000 to 9986321099.

import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { BAM_ROLES } from "@/auth/bam-roles";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import {
  counsellingSessions,
  counsellingSharings,
  students,
} from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { readCampusSessionCount, readSharedList } from "./shared-board";
import { SHARED_PAGE_SIZE } from "./shared-view";
import { addTestActor } from "./test-consents";
import {
  addTestMentorOf,
  addTestRecipient,
  PUBLISHED_AT,
  publishTestSharing,
  TEST_SUMMARY,
  type TestShare,
} from "./test-shared";
import { addSharingStudent } from "./test-sharings";

const inTestDatabase = withTestDatabase();

const PROGRAM = "Prodi Uji Daftar Berbagi";

// Rabu 21 October 2026, 10:00 on campus.
const NOW = new Date("2026-10-21T03:00:00Z");

describe("Data yang dipublikasikan untuk Anda", () => {
  it("lists a student published to the role with name, NIM, program, Pengasuh, the data shared and the date, and nothing else", async () => {
    await inTestDatabase(async (db) => {
      const people = await addSharingStudent(db, `${PROGRAM} 1`, "9986321001");
      const { mentor } = await addTestMentorOf(db, people.studentId);
      await publishTestSharing(db, people, {
        data: ["counselling", "summary"],
        recipients: ["mentor"],
      });

      const list = await readSharedList(db, mentor, 1);

      expect(list).toEqual({
        rows: [
          {
            studentId: people.studentId,
            name: "Mahasiswa Uji Konseling 1",
            nim: "9986321001",
            program: `${PROGRAM} 1`,
            mentorName: "Pengasuh Uji",
            data: ["counselling", "summary"],
            publishedAt: PUBLISHED_AT,
          },
        ],
        matching: 1,
        page: 1,
        menteesOnly: true,
      });
      const sent = JSON.stringify(list);
      expect(sent).not.toContain("Catatan uji sesi.");
      expect(sent).not.toContain(TEST_SUMMARY);
      expect(sent).not.toContain("academic");
    });
  });

  it("is empty for a recipient with nothing published for them, and says anak asuh only for a Pengasuh alone", async () => {
    await inTestDatabase(async (db) => {
      const people = await addSharingStudent(db, `${PROGRAM} 2`, "9986321002");
      await publishTestSharing(db, people, {
        data: ["counselling"],
        recipients: ["director"],
      });
      const mentor = await addTestActor(db, "Pengasuh Uji", ["mentor"]);
      const both = await addTestActor(db, "Dua Peran", [
        "mentor",
        "head_of_unit",
      ]);

      expect(await readSharedList(db, mentor, 1)).toEqual({
        rows: [],
        matching: 0,
        page: 1,
        menteesOnly: true,
      });
      expect(await readSharedList(db, both, 1)).toMatchObject({
        rows: [],
        menteesOnly: false,
      });
    });
  });

  it("lists the newest published first, and leaves out a removed student", async () => {
    await inTestDatabase(async (db) => {
      const head = await addTestActor(db, "Kepala Uji", ["head_of_unit"]);
      const share: TestShare = {
        data: ["counselling"],
        recipients: ["head_of_unit"],
      };
      const older = await addSharingStudent(db, `${PROGRAM} 6`, "9986321040");
      const newer = await addSharingStudent(db, `${PROGRAM} 7`, "9986321041");
      const removed = await addSharingStudent(db, `${PROGRAM} 8`, "9986321042");
      for (const people of [older, newer, removed]) {
        await publishTestSharing(db, people, share);
      }
      await db
        .update(counsellingSharings)
        .set({ publishedAt: new Date(PUBLISHED_AT.getTime() + 60_000) })
        .where(eq(counsellingSharings.studentId, newer.studentId));
      await db
        .update(students)
        .set({ deletedAt: NOW, deletedBy: head.id })
        .where(eq(students.id, removed.studentId));

      const list = await readSharedList(db, head, 1);

      expect(list?.rows.map((row) => row.studentId)).toEqual([
        newer.studentId,
        older.studentId,
      ]);
      expect(list?.matching).toBe(2);
    });
  });

  it("loads 20 at a time", async () => {
    await inTestDatabase(async (db) => {
      const head = await addTestActor(db, "Kepala Uji", ["head_of_unit"]);
      const ids: string[] = [];
      for (let place = 0; place <= SHARED_PAGE_SIZE; place += 1) {
        const nim = `99863210${String(10 + place)}`;
        const people = await addSharingStudent(
          db,
          `${PROGRAM} 3-${place}`,
          nim,
        );
        await publishTestSharing(db, people, {
          data: ["counselling"],
          recipients: ["head_of_unit"],
        });
        ids.push(people.studentId);
      }

      const first = await readSharedList(db, head, 1);
      const second = await readSharedList(db, head, 2);

      expect(SHARED_PAGE_SIZE).toBe(20);
      expect(first?.matching).toBe(SHARED_PAGE_SIZE + 1);
      expect(first?.rows).toHaveLength(SHARED_PAGE_SIZE);
      expect(second?.rows).toHaveLength(1);
      expect(second?.page).toBe(2);
      // Same date for all: then by name, so the pages hold every student once.
      const shown = [...(first?.rows ?? []), ...(second?.rows ?? [])].map(
        (row) => row.studentId,
      );
      expect(new Set(shown)).toEqual(new Set(ids));
    });
  });

  it.each<RoleId>([
    "assessor",
    "upk_staff",
    "dorm_manager",
    ...BAM_ROLES,
    "counsellor",
    "student",
  ])("sends %s nothing", async (role) => {
    await inTestDatabase(async (db) => {
      const people = await addSharingStudent(db, `${PROGRAM} 4`, "9986321004");
      await publishTestSharing(db, people, {
        data: ["counselling"],
        recipients: ["head_of_unit", "director", "head_of_program", "mentor"],
      });
      const other = await addTestRecipient(db, [role], people.studentId);
      expect(await readSharedList(db, other, 1)).toBeNull();
      expect(await readCampusSessionCount(db, other, NOW)).toBeNull();
    });
  });
});

async function addSessions(db: Database, days: string[]): Promise<string> {
  const people = await addSharingStudent(db, `${PROGRAM} 5`, "9986321005");
  for (const day of days) {
    await db.insert(counsellingSessions).values({
      studentId: people.studentId,
      day,
      kind: "group",
      topic: "academic",
      notes: "Catatan uji sesi.",
      followUp: "monitoring",
      writtenBy: people.counsellor.id,
      writtenAt: NOW,
      changedBy: people.counsellor.id,
      changedAt: NOW,
    });
  }
  return people.studentId;
}

async function countsOf(db: Database): Promise<(string | null)[]> {
  const counts: (string | null)[] = [];
  for (const role of [
    "head_of_unit",
    "director",
    "head_of_program",
    "mentor",
  ] as RoleId[]) {
    const actor = await addTestActor(db, "Penghitung Uji", [role]);
    counts.push(await readCampusSessionCount(db, actor, NOW));
  }
  return counts;
}

describe("Sesi konseling 30 hari", () => {
  it("is 0 with no session in the last 30 days", async () => {
    await inTestDatabase(async (db) => {
      expect(await countsOf(db)).toEqual(["0", "0", "0", "0"]);
    });
  });

  it("sends <5 and no smaller number for 1 to 4 sessions, the same to all four roles", async () => {
    await inTestDatabase(async (db) => {
      // The test student already has the session of 19 October.
      await addSessions(db, ["2026-10-01"]);
      expect(await countsOf(db)).toEqual(["<5", "<5", "<5", "<5"]);
    });
  });

  it("counts each session from 5 on, from 30 days ago to today only", async () => {
    await inTestDatabase(async (db) => {
      await addSessions(db, [
        "2026-09-20",
        "2026-09-21",
        "2026-10-02",
        "2026-10-03",
        "2026-10-21",
        "2026-10-22",
      ]);
      expect(await countsOf(db)).toEqual(["5", "5", "5", "5"]);
    });
  });

  it("leaves out the sessions of a removed student", async () => {
    await inTestDatabase(async (db) => {
      const studentId = await addSessions(db, [
        "2026-10-02",
        "2026-10-03",
        "2026-10-04",
        "2026-10-05",
      ]);
      expect(await countsOf(db)).toEqual(["5", "5", "5", "5"]);
      const by = await addTestActor(db, "Penghapus Uji", ["head_of_unit"]);
      await db
        .update(students)
        .set({ deletedAt: NOW, deletedBy: by.id })
        .where(eq(students.id, studentId));
      expect(await countsOf(db)).toEqual(["0", "0", "0", "0"]);
    });
  });
});
