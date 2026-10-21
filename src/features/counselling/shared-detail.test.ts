// Sample NIMs of this file: 9986322000 to 9986322099.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { AccountForAccess } from "@/auth/access";
import { BAM_ROLES } from "@/auth/bam-roles";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import {
  counsellingSchedules,
  counsellingSessions,
  counsellingSharingReads,
} from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { changeOwnSharing } from "./press-sharing";
import { openSharedDetail } from "./shared-detail";
import { SHARED_GONE, SHARED_NOT_ALLOWED } from "./shared-words";
import type { SharingView } from "./sharing-view";
import { addTestActor } from "./test-consents";
import {
  addTestMentorOf,
  addTestRecipient,
  PUBLISHED_AT,
  publishTestSharing,
  TEST_SUMMARY,
  type TestShare,
} from "./test-shared";
import { addSharingStudent, type SharingStudent } from "./test-sharings";

const inTestDatabase = withTestDatabase();

// 10:00 on campus on Rabu 21 October 2026.
const NOW = new Date("2026-10-21T03:00:00Z");

const STORY = "Cerita uji yang hanya dibaca konselor.";

let place = 0;

function studentOf(people: SharingStudent): AccountForAccess {
  const [student] = people.students;
  if (!student) throw new Error("Student missing.");
  return student;
}

interface Shared {
  people: SharingStudent;
  sharing: SharingView;
}

/** A student with a session, a request with a story, and a published sharing. */
async function sharedStudent(db: Database, share: TestShare): Promise<Shared> {
  place += 1;
  const nim = `99863220${String(place).padStart(2, "0")}`;
  const people = await addSharingStudent(db, `Prodi Uji Rincian ${place}`, nim);
  await db.insert(counsellingSchedules).values({
    studentId: people.studentId,
    kind: "voluntary",
    status: "submitted",
    topic: "family",
    day: "2026-10-28",
    hour: "08:30",
    way: "in_person",
    story: STORY,
    createdAt: NOW,
    changedBy: studentOf(people).id,
    changedAt: NOW,
  });
  const sharing = await publishTestSharing(db, people, share);
  return { people, sharing };
}

function readingsOf(db: Database, studentId: string) {
  return db
    .select()
    .from(counsellingSharingReads)
    .where(eq(counsellingSharingReads.studentId, studentId));
}

const BOTH: TestShare = {
  data: ["counselling", "summary"],
  recipients: ["head_of_unit", "director", "head_of_program", "mentor"],
};

describe("Rincian of shared counselling data", () => {
  it("sends only the number of sessions, the last date, the follow-up, the summary and who published it when, and logs who read whose data when", async () => {
    await inTestDatabase(async (db) => {
      const { people } = await sharedStudent(db, BOTH);
      const { mentor } = await addTestMentorOf(db, people.studentId);

      const opened = await openSharedDetail(db, mentor, people.studentId, NOW);

      expect(opened).toEqual({
        ok: true,
        value: {
          data: ["counselling", "summary"],
          counselling: {
            count: 1,
            lastDay: "2026-10-19",
            followUp: "monitoring",
            nextDay: null,
          },
          summary: TEST_SUMMARY,
          publishedByName: "Konselor Uji",
          publishedAt: PUBLISHED_AT,
        },
      });
      const sent = JSON.stringify(opened);
      for (const secret of [
        "Catatan uji sesi.",
        STORY,
        "academic",
        "family",
        "2026-10-28",
        "paper",
        "approved",
      ]) {
        expect(sent).not.toContain(secret);
      }
      const readings = await readingsOf(db, people.studentId);
      expect(readings).toHaveLength(1);
      const [reading] = readings;
      expect(Object.keys(reading ?? {}).sort()).toEqual([
        "id",
        "readAt",
        "readBy",
        "sharingId",
        "studentId",
      ]);
      expect(reading).toMatchObject({
        studentId: people.studentId,
        readBy: mentor.id,
        readAt: NOW,
      });
    });
  });

  it("logs each opening again", async () => {
    await inTestDatabase(async (db) => {
      const { people } = await sharedStudent(db, BOTH);
      const head = await addTestRecipient(
        db,
        ["head_of_unit"],
        people.studentId,
      );
      await openSharedDetail(db, head, people.studentId, NOW);
      await openSharedDetail(db, head, people.studentId, NOW);
      expect(await readingsOf(db, people.studentId)).toHaveLength(2);
    });
  });

  it("sends nothing of the sessions when only the summary is shared, and no summary when only the counselling is", async () => {
    await inTestDatabase(async (db) => {
      const { people: summaryOnly } = await sharedStudent(db, {
        data: ["summary"],
        recipients: ["director"],
      });
      const director = await addTestRecipient(
        db,
        ["director"],
        summaryOnly.studentId,
      );
      const opened = await openSharedDetail(
        db,
        director,
        summaryOnly.studentId,
        NOW,
      );
      expect(opened).toMatchObject({
        ok: true,
        value: { data: ["summary"], counselling: null, summary: TEST_SUMMARY },
      });
      expect(JSON.stringify(opened)).not.toContain("2026-10-19");

      const { people: counsellingOnly } = await sharedStudent(db, {
        data: ["counselling"],
        recipients: ["director"],
      });
      expect(
        await openSharedDetail(db, director, counsellingOnly.studentId, NOW),
      ).toMatchObject({
        ok: true,
        value: { data: ["counselling"], summary: null },
      });
    });
  });

  it("shows the next session only while it is today or later", async () => {
    await inTestDatabase(async (db) => {
      const { people } = await sharedStudent(db, BOTH);
      await db
        .update(counsellingSessions)
        .set({ nextDay: "2026-10-21", followUp: "next_session" })
        .where(eq(counsellingSessions.studentId, people.studentId));
      const head = await addTestRecipient(
        db,
        ["head_of_unit"],
        people.studentId,
      );
      expect(
        await openSharedDetail(db, head, people.studentId, NOW),
      ).toMatchObject({
        value: {
          counselling: { followUp: "next_session", nextDay: "2026-10-21" },
        },
      });
      const later = new Date("2026-10-22T03:00:00Z");
      expect(
        await openSharedDetail(db, head, people.studentId, later),
      ).toMatchObject({ value: { counselling: { nextDay: null } } });
    });
  });
});

describe("a hand-made request for Rincian", () => {
  async function refusedFor(
    db: Database,
    actor: AccountForAccess,
    studentId: unknown,
    error: string,
  ) {
    expect(await openSharedDetail(db, actor, studentId, NOW)).toEqual({
      ok: false,
      error,
    });
  }

  it.each<RoleId>([
    "assessor",
    "upk_staff",
    "dorm_manager",
    ...BAM_ROLES,
    "counsellor",
    "discipline_officer",
    "student",
  ])("is refused to %s, with nothing logged", async (role) => {
    await inTestDatabase(async (db) => {
      const { people } = await sharedStudent(db, BOTH);
      const other = await addTestRecipient(db, [role], people.studentId);
      await refusedFor(db, other, people.studentId, SHARED_NOT_ALLOWED);
      expect(await readingsOf(db, people.studentId)).toEqual([]);
    });
  });

  it("is refused to a recipient role that is not named, and for a student outside the recipient's rows, with nothing logged", async () => {
    await inTestDatabase(async (db) => {
      const { people } = await sharedStudent(db, {
        data: ["counselling", "summary"],
        recipients: ["head_of_program", "mentor"],
      });
      const head = await addTestRecipient(
        db,
        ["head_of_unit"],
        people.studentId,
      );
      await refusedFor(db, head, people.studentId, SHARED_GONE);

      const elsewhere = await addSharingStudent(
        db,
        "Prodi Uji Rincian Lain",
        "9986322090",
      );
      const otherHead = await addTestRecipient(
        db,
        ["head_of_program"],
        elsewhere.studentId,
      );
      await refusedFor(db, otherHead, people.studentId, SHARED_GONE);
      const stranger = await addTestActor(db, "Pengasuh Lain", ["mentor"]);
      await refusedFor(db, stranger, people.studentId, SHARED_GONE);
      expect(await readingsOf(db, people.studentId)).toEqual([]);
    });
  });

  it("is refused for a student id that is not one", async () => {
    await inTestDatabase(async (db) => {
      const head = await addTestActor(db, "Kepala Uji", ["head_of_unit"]);
      await refusedFor(db, head, "bukan-id", SHARED_GONE);
      await refusedFor(db, head, 42, SHARED_GONE);
    });
  });

  it("is refused once the student withdrew the sharing, with a message", async () => {
    await inTestDatabase(async (db) => {
      const { people, sharing } = await sharedStudent(db, BOTH);
      const head = await addTestRecipient(
        db,
        ["head_of_unit"],
        people.studentId,
      );
      const opened = await openSharedDetail(db, head, people.studentId, NOW);
      expect(opened.ok).toBe(true);

      const withdrawn = await changeOwnSharing(
        db,
        studentOf(people),
        "withdraw",
        sharing.id,
        sharing.version,
        NOW,
      );
      expect(withdrawn.kind).toBe("kept");

      await refusedFor(db, head, people.studentId, SHARED_GONE);
      expect(SHARED_GONE).toBe(
        "Data ini tidak lagi dibagikan untuk Anda. Muat ulang halaman untuk melihat daftar terbaru.",
      );
      expect(await readingsOf(db, people.studentId)).toHaveLength(1);
    });
  });
});
