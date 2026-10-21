// Sample NIMs of this file: 9986311000 to 9986311099.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { ROLE_IDS } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { counsellingSharingChanges, counsellingSharings } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { changeOwnConsent } from "./change-consent";
import { askSharing } from "./change-sharing";
import { readConsentOf } from "./consent-reads";
import { STUDENT_NOT_FOUND } from "./consent-words";
import { changeSharingAsCounsellor } from "./publish-sharing";
import { readSharingPanel } from "./sharing-reads";
import {
  askedMessage,
  NEEDS_COUNSELLING_CONSENT,
  NO_DATA,
  NO_RECIPIENT,
  NO_SCREENING,
  NO_SESSION,
  NO_SUMMARY,
  SHARING_CHANGED,
  SHARING_NOT_ALLOWED,
} from "./sharing-words";
import { addTestActor, addTestPeople } from "./test-consents";
import { addTestScreening } from "./test-screenings";
import { addConsentedPeople } from "./test-sessions";
import { publishTestSharing } from "./test-shared";
import {
  ASKED_AT,
  addSharingStudent,
  askedSharing,
  TEST_ASK,
} from "./test-sharings";

const inTestDatabase = withTestDatabase();

const PROGRAM = "Prodi Uji Minta Berbagi";

function sharingsOf(db: Database, studentId: string) {
  return db
    .select()
    .from(counsellingSharings)
    .where(eq(counsellingSharings.studentId, studentId));
}

function logOf(db: Database, sharingId: string) {
  return db
    .select()
    .from(counsellingSharingChanges)
    .where(eq(counsellingSharingChanges.sharingId, sharingId));
}

describe("Minta persetujuan mahasiswa", () => {
  it("keeps a request Menunggu persetujuan, as the work of Konselor, with its log line of what is shared with whom", async () => {
    await inTestDatabase(async (db) => {
      const people = await addSharingStudent(db, PROGRAM, "9986311001");

      const outcome = await askSharing(
        db,
        people.counsellor,
        people.studentId,
        TEST_ASK,
        ASKED_AT,
      );

      expect(outcome).toMatchObject({
        kind: "kept",
        done: askedMessage("Mahasiswa Uji Konseling 1"),
        sharing: {
          status: "waiting",
          data: ["counselling", "summary"],
          recipients: ["head_of_unit", "mentor"],
          summary: TEST_ASK.summary,
        },
      });
      const [kept] = await sharingsOf(db, people.studentId);
      expect(kept).toMatchObject({
        status: "waiting",
        way: null,
        askedBy: people.counsellor.id,
        askedAt: ASKED_AT,
        publishedAt: null,
      });
      expect(await logOf(db, kept?.id ?? "")).toEqual([
        expect.objectContaining({
          changedBy: people.counsellor.id,
          changedAt: ASKED_AT,
          step: "ask",
          statusBefore: null,
          statusAfter: "waiting",
          shared: {
            data: ["counselling", "summary"],
            recipients: ["head_of_unit", "mentor"],
            summary: TEST_ASK.summary,
          },
        }),
      ]);
    });
  });

  it("saves nothing with no data, no recipient, or a chosen summary under 10 letters, and says why", async () => {
    await inTestDatabase(async (db) => {
      const people = await addSharingStudent(db, PROGRAM, "9986311002");
      const { counsellor, studentId } = people;
      const sends = [
        [{ ...TEST_ASK, data: [] }, NO_DATA],
        [{ ...TEST_ASK, recipients: [] }, NO_RECIPIENT],
        [{ ...TEST_ASK, summary: "Pendek" }, NO_SUMMARY],
      ] as const;
      for (const [sent, error] of sends) {
        expect(await askSharing(db, counsellor, studentId, sent)).toEqual({
          kind: "refused",
          error,
        });
      }
      expect(await sharingsOf(db, studentId)).toEqual([]);
    });
  });

  it("is refused for a student with no session, and the panel says so", async () => {
    await inTestDatabase(async (db) => {
      const people = await addConsentedPeople(db, PROGRAM, ["9986311003"]);
      const [studentId] = people.studentIds;

      expect(
        await askSharing(db, people.counsellor, studentId, TEST_ASK),
      ).toEqual({ kind: "refused", error: NO_SESSION });
      expect(await readSharingPanel(db, people.counsellor, studentId)).toEqual({
        ok: true,
        value: {
          hasSessions: false,
          hasScreening: false,
          hasConsent: true,
          sharing: null,
        },
      });
    });
  });

  it("keeps the level alone for a student with a screening and no session, and refuses the rest without a session", async () => {
    await inTestDatabase(async (db) => {
      const people = await addConsentedPeople(db, PROGRAM, ["9986311009"]);
      const [studentId] = people.studentIds;
      if (!studentId) throw new Error("Student missing.");
      await addTestScreening(db, studentId, people.counsellor.id);

      expect(
        await askSharing(db, people.counsellor, studentId, {
          ...TEST_ASK,
          data: ["level", "counselling"],
        }),
      ).toEqual({ kind: "refused", error: NO_SESSION });
      expect(
        await askSharing(db, people.counsellor, studentId, {
          ...TEST_ASK,
          data: ["level"],
        }),
      ).toMatchObject({
        kind: "kept",
        sharing: { status: "waiting", data: ["level"], summary: null },
      });
    });
  });

  it("refuses the level for a student with no screening", async () => {
    await inTestDatabase(async (db) => {
      const people = await addSharingStudent(db, PROGRAM, "9986311010");
      expect(
        await askSharing(db, people.counsellor, people.studentId, {
          ...TEST_ASK,
          data: ["level", "counselling"],
        }),
      ).toEqual({ kind: "refused", error: NO_SCREENING });
      expect(await sharingsOf(db, people.studentId)).toEqual([]);
    });
  });

  it("does not let an agreement without the level cover it: the level needs a new request the student answers again", async () => {
    await inTestDatabase(async (db) => {
      const people = await addSharingStudent(db, PROGRAM, "9986311011");
      await addTestScreening(db, people.studentId, people.counsellor.id);
      const published = await publishTestSharing(db, people, {
        data: ["counselling"],
        recipients: ["head_of_unit"],
      });

      await expect(
        db.transaction((tx) =>
          tx
            .update(counsellingSharings)
            .set({ data: ["level", "counselling"] })
            .where(eq(counsellingSharings.id, published.id)),
        ),
      ).rejects.toThrow();
      const withLevel = { ...TEST_ASK, data: ["level", "counselling"] };
      expect(
        await askSharing(db, people.counsellor, people.studentId, withLevel),
      ).toMatchObject({
        kind: "changed",
        sharing: { id: published.id, data: ["counselling"] },
      });

      await changeSharingAsCounsellor(
        db,
        people.counsellor,
        people.studentId,
        "cancel",
        published.id,
        published.version,
      );
      const asked = await askSharing(
        db,
        people.counsellor,
        people.studentId,
        withLevel,
      );

      expect(asked).toMatchObject({
        kind: "kept",
        sharing: { status: "waiting", data: ["level", "counselling"] },
      });
      const kept = await sharingsOf(db, people.studentId);
      expect(kept.map((each) => [each.status, each.data])).toEqual(
        expect.arrayContaining([
          ["cancelled", ["counselling"]],
          ["waiting", ["level", "counselling"]],
        ]),
      );
    });
  });

  it("is refused once the consent to counselling is withdrawn", async () => {
    await inTestDatabase(async (db) => {
      const people = await addSharingStudent(db, PROGRAM, "9986311004");
      const [student] = people.students;
      if (!student) throw new Error("Student missing.");
      const consent = await readConsentOf(db, people.studentId);
      await changeOwnConsent(db, student, "withdraw", consent?.version);

      expect(
        await askSharing(db, people.counsellor, people.studentId, TEST_ASK),
      ).toEqual({ kind: "refused", error: NEEDS_COUNSELLING_CONSENT });
      expect(await sharingsOf(db, people.studentId)).toEqual([]);
    });
  });

  it("is never kept twice while one is current: a student has at most one", async () => {
    await inTestDatabase(async (db) => {
      const people = await addSharingStudent(db, PROGRAM, "9986311005");
      await askedSharing(db, people);

      const again = await askSharing(db, people.counsellor, people.studentId, {
        ...TEST_ASK,
        recipients: ["director"],
      });

      expect(again).toMatchObject({
        kind: "changed",
        error: SHARING_CHANGED,
        sharing: { status: "waiting", recipients: ["head_of_unit", "mentor"] },
      });
      expect(await sharingsOf(db, people.studentId)).toHaveLength(1);
    });
  });

  it("is refused for a student Konselor may not pick", async () => {
    await inTestDatabase(async (db) => {
      const counsellor = await addTestActor(db, "Konselor Uji", ["counsellor"]);
      for (const studentId of ["bukan-id", null, crypto.randomUUID()]) {
        expect(await askSharing(db, counsellor, studentId, TEST_ASK)).toEqual({
          kind: "refused",
          error: STUDENT_NOT_FOUND,
        });
      }
    });
  });

  it("is refused to every role but Konselor, Pengasuh, Kepala Unit and Mahasiswa among them, giving nothing back", async () => {
    await inTestDatabase(async (db) => {
      const people = await addSharingStudent(db, PROGRAM, "9986311006");
      const others = ROLE_IDS.filter((role) => role !== "counsellor");
      expect(others).toEqual(
        expect.arrayContaining(["mentor", "head_of_unit", "student"]),
      );
      for (const role of others) {
        const actor = await addTestActor(db, `Uji ${role}`, [role]);
        expect(await askSharing(db, actor, people.studentId, TEST_ASK)).toEqual(
          { kind: "refused", error: SHARING_NOT_ALLOWED },
        );
        expect(await readSharingPanel(db, actor, people.studentId)).toEqual({
          ok: false,
          error: STUDENT_NOT_FOUND,
        });
      }
      expect(await sharingsOf(db, people.studentId)).toEqual([]);
    });
  });
});

describe("Publikasi data kesehatan mental of a picked student", () => {
  it("shows the latest request, with the session and the consent", async () => {
    await inTestDatabase(async (db) => {
      const people = await addSharingStudent(db, PROGRAM, "9986311007");
      const asked = await askedSharing(db, people);

      expect(
        await readSharingPanel(db, people.counsellor, people.studentId),
      ).toEqual({
        ok: true,
        value: {
          hasSessions: true,
          hasScreening: false,
          hasConsent: true,
          sharing: asked,
        },
      });
    });
  });

  it("says whether the student has a screening", async () => {
    await inTestDatabase(async (db) => {
      const people = await addConsentedPeople(db, PROGRAM, ["9986311012"]);
      const [studentId] = people.studentIds;
      if (!studentId) throw new Error("Student missing.");
      await addTestScreening(db, studentId, people.counsellor.id);
      expect(
        await readSharingPanel(db, people.counsellor, studentId),
      ).toMatchObject({
        ok: true,
        value: { hasSessions: false, hasScreening: true },
      });
    });
  });

  it("is refused for a student never asked about their consent, who has no session either", async () => {
    await inTestDatabase(async (db) => {
      const people = await addTestPeople(db, PROGRAM, ["9986311008"]);
      expect(
        await readSharingPanel(db, people.counsellor, people.studentIds[0]),
      ).toEqual({
        ok: true,
        value: {
          hasSessions: false,
          hasScreening: false,
          hasConsent: false,
          sharing: null,
        },
      });
    });
  });
});
