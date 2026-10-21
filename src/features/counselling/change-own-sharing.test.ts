// Sample NIMs of this file: 9986312000 to 9986312099.
import { asc, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { ROLE_IDS } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { counsellingSharingChanges, counsellingSharings } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { changeOwnConsent } from "./change-consent";
import { askSharing } from "./change-sharing";
import { readConsentOf } from "./consent-reads";
import { changeOwnSharing } from "./press-sharing";
import { readOwnSharing, readShownSharing } from "./sharing-reads";
import {
  askedMessage,
  SHARING_CHANGED,
  SHARING_NOT_ALLOWED,
  STUDENT_APPROVED_MESSAGE,
  STUDENT_DECLINED_MESSAGE,
  STUDENT_WITHDRAWN_MESSAGE,
} from "./sharing-words";
import {
  ASKED_AT,
  addSharingStudent,
  askedSharing,
  type SharingStudent,
  TEST_ASK,
} from "./test-sharings";

const inTestDatabase = withTestDatabase();

const PROGRAM = "Prodi Uji Jawab Berbagi";

// A minute after the request was sent.
const ANSWERED_AT = new Date(ASKED_AT.getTime() + 60_000);
const LATER = new Date(ASKED_AT.getTime() + 120_000);

function studentOf(people: SharingStudent) {
  const [student] = people.students;
  if (!student) throw new Error("Student missing.");
  return student;
}

function sharingsOf(db: Database, studentId: string) {
  return db
    .select()
    .from(counsellingSharings)
    .where(eq(counsellingSharings.studentId, studentId))
    .orderBy(asc(counsellingSharings.askedAt));
}

function logOf(db: Database, sharingId: string) {
  return db
    .select()
    .from(counsellingSharingChanges)
    .where(eq(counsellingSharingChanges.sharingId, sharingId))
    .orderBy(asc(counsellingSharingChanges.changedAt));
}

describe("the student's answer to a request to share", () => {
  it("is shown on their own page with what is shared with whom, and the exact summary", async () => {
    await inTestDatabase(async (db) => {
      const people = await addSharingStudent(db, PROGRAM, "9986312001");
      const asked = await askedSharing(db, people);

      expect(await readOwnSharing(db, studentOf(people))).toEqual({
        ...asked,
        publishedByName: null,
      });
      expect(await readOwnSharing(db, people.counsellor)).toBeNull();
    });
  });

  it("Setujui berbagi data makes it Disetujui online, as the student's work, with its log line; recipients still see nothing", async () => {
    await inTestDatabase(async (db) => {
      const people = await addSharingStudent(db, PROGRAM, "9986312002");
      const asked = await askedSharing(db, people);
      const student = studentOf(people);

      const outcome = await changeOwnSharing(
        db,
        student,
        "approve",
        asked.id,
        asked.version,
        ANSWERED_AT,
      );

      expect(outcome).toMatchObject({
        kind: "kept",
        done: STUDENT_APPROVED_MESSAGE,
        sharing: { status: "approved", way: "online" },
      });
      const [kept] = await sharingsOf(db, people.studentId);
      expect(kept).toMatchObject({
        status: "approved",
        way: "online",
        answeredAt: ANSWERED_AT,
        changedBy: student.id,
      });
      const lines = await logOf(db, asked.id);
      expect(lines.at(-1)).toMatchObject({
        changedBy: student.id,
        changedAt: ANSWERED_AT,
        step: "approve",
        statusBefore: "waiting",
        statusAfter: "approved",
        shared: {
          data: ["counselling", "summary"],
          recipients: ["head_of_unit", "mentor"],
          summary: TEST_ASK.summary,
        },
      });
      expect(await readShownSharing(db, people.studentId)).toBeNull();
    });
  });

  it("Tolak makes it Ditolak, and Konselor may send a new request", async () => {
    await inTestDatabase(async (db) => {
      const people = await addSharingStudent(db, PROGRAM, "9986312003");
      const asked = await askedSharing(db, people);

      const outcome = await changeOwnSharing(
        db,
        studentOf(people),
        "decline",
        asked.id,
        asked.version,
        ANSWERED_AT,
      );

      expect(outcome).toEqual({
        kind: "kept",
        done: STUDENT_DECLINED_MESSAGE,
        sharing: null,
      });
      const again = await askSharing(
        db,
        people.counsellor,
        people.studentId,
        TEST_ASK,
        LATER,
      );
      expect(again).toMatchObject({
        kind: "kept",
        done: askedMessage("Mahasiswa Uji Konseling 1"),
      });
      const statuses = (await sharingsOf(db, people.studentId)).map(
        (each) => each.status,
      );
      expect(statuses).toEqual(["declined", "waiting"]);
    });
  });

  it("Cabut persetujuan berbagi makes an approved one Dicabut, and Konselor may send a new request", async () => {
    await inTestDatabase(async (db) => {
      const people = await addSharingStudent(db, PROGRAM, "9986312004");
      const asked = await askedSharing(db, people);
      const student = studentOf(people);
      const approved = await changeOwnSharing(
        db,
        student,
        "approve",
        asked.id,
        asked.version,
        ANSWERED_AT,
      );
      if (approved.kind !== "kept") throw new Error("Not approved.");

      const outcome = await changeOwnSharing(
        db,
        student,
        "withdraw",
        asked.id,
        approved.sharing?.version,
        LATER,
      );

      expect(outcome).toEqual({
        kind: "kept",
        done: STUDENT_WITHDRAWN_MESSAGE,
        sharing: null,
      });
      expect((await logOf(db, asked.id)).map((line) => line.step)).toEqual([
        "ask",
        "approve",
        "withdraw",
      ]);
      expect(
        await askSharing(db, people.counsellor, people.studentId, TEST_ASK),
      ).toMatchObject({ kind: "kept" });
    });
  });

  it("Cabut persetujuan berbagi is kept even when the page showed an older version", async () => {
    await inTestDatabase(async (db) => {
      const people = await addSharingStudent(db, PROGRAM, "9986312005");
      const asked = await askedSharing(db, people);
      const student = studentOf(people);
      await changeOwnSharing(
        db,
        student,
        "approve",
        asked.id,
        asked.version,
        ANSWERED_AT,
      );

      const outcome = await changeOwnSharing(
        db,
        student,
        "withdraw",
        asked.id,
        asked.version,
        LATER,
      );

      expect(outcome).toMatchObject({ kind: "kept" });
    });
  });

  it("Setujui pressed twice keeps one answer; the second is told it changed", async () => {
    await inTestDatabase(async (db) => {
      const people = await addSharingStudent(db, PROGRAM, "9986312006");
      const asked = await askedSharing(db, people);
      const student = studentOf(people);
      const press = () =>
        changeOwnSharing(
          db,
          student,
          "approve",
          asked.id,
          asked.version,
          ANSWERED_AT,
        );

      await press();
      expect(await press()).toMatchObject({
        kind: "changed",
        error: SHARING_CHANGED,
        sharing: { status: "approved" },
      });
      expect(await logOf(db, asked.id)).toHaveLength(2);
    });
  });

  it("is refused on another student's sharing, which stays as it was", async () => {
    await inTestDatabase(async (db) => {
      const one = await addSharingStudent(db, PROGRAM, "9986312007");
      const other = await addSharingStudent(
        db,
        "Prodi Uji Jawab Berbagi Lain",
        "9986312008",
      );
      const asked = await askedSharing(db, other);

      for (const move of ["approve", "decline"] as const) {
        const outcome = await changeOwnSharing(
          db,
          studentOf(one),
          move,
          asked.id,
          asked.version,
        );
        expect(outcome).toMatchObject({ kind: "changed", sharing: null });
      }
      const [kept] = await sharingsOf(db, other.studentId);
      expect(kept?.status).toBe("waiting");
      expect(await logOf(db, asked.id)).toHaveLength(1);
    });
  });

  it("is refused to every role but Mahasiswa, Konselor, Pengasuh and Kepala Unit among them, giving nothing back", async () => {
    await inTestDatabase(async (db) => {
      const people = await addSharingStudent(db, PROGRAM, "9986312009");
      const asked = await askedSharing(db, people);
      const others = ROLE_IDS.filter((role) => role !== "student");
      expect(others).toEqual(
        expect.arrayContaining(["counsellor", "mentor", "head_of_unit"]),
      );
      for (const role of others) {
        const actor = { ...studentOf(people), roles: [role] };
        expect(
          await changeOwnSharing(db, actor, "approve", asked.id, asked.version),
        ).toEqual({ kind: "refused", error: SHARING_NOT_ALLOWED });
      }
      const [kept] = await sharingsOf(db, people.studentId);
      expect(kept?.status).toBe("waiting");
    });
  });
});

describe("withdrawing the consent to counselling", () => {
  it.each([
    ["waiting", false],
    ["approved", true],
  ] as const)(
    "makes a current %s sharing Dicabut at once, with its log line, so recipients see nothing",
    async (status, approves) => {
      await inTestDatabase(async (db) => {
        const nim = approves ? "9986312010" : "9986312011";
        const people = await addSharingStudent(db, PROGRAM, nim);
        const asked = await askedSharing(db, people);
        const student = studentOf(people);
        if (approves) {
          await changeOwnSharing(
            db,
            student,
            "approve",
            asked.id,
            asked.version,
            ANSWERED_AT,
          );
        }
        expect((await sharingsOf(db, people.studentId))[0]?.status).toBe(
          status,
        );
        const consent = await readConsentOf(db, people.studentId);

        const withdrawn = await changeOwnConsent(
          db,
          student,
          "withdraw",
          consent?.version,
          LATER,
        );

        expect(withdrawn).toMatchObject({ kind: "kept" });
        const [kept] = await sharingsOf(db, people.studentId);
        expect(kept).toMatchObject({
          status: "withdrawn",
          changedBy: student.id,
          changedAt: LATER,
        });
        expect((await logOf(db, asked.id)).at(-1)).toMatchObject({
          changedBy: student.id,
          changedAt: LATER,
          step: "consent_withdrawn",
          statusBefore: status,
          statusAfter: "withdrawn",
        });
        expect(await readShownSharing(db, people.studentId)).toBeNull();
        expect(await readOwnSharing(db, student)).toBeNull();
      });
    },
  );

  it("leaves a sharing that already ended as it was", async () => {
    await inTestDatabase(async (db) => {
      const people = await addSharingStudent(db, PROGRAM, "9986312012");
      const asked = await askedSharing(db, people);
      const student = studentOf(people);
      await changeOwnSharing(
        db,
        student,
        "decline",
        asked.id,
        asked.version,
        ANSWERED_AT,
      );
      const consent = await readConsentOf(db, people.studentId);

      await changeOwnConsent(db, student, "withdraw", consent?.version, LATER);

      const [kept] = await sharingsOf(db, people.studentId);
      expect(kept?.status).toBe("declined");
      expect(await logOf(db, asked.id)).toHaveLength(2);
    });
  });
});
