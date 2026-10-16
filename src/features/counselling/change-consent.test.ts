// Sample NIMs of this file: 9986201000 to 9986201099.
import { asc, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import { counsellingConsentChanges, students } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { changeConsentAsCounsellor, NOT_ALLOWED } from "./change-consent";
import { NO_CONSENT_VERSION } from "./consent-view";
import {
  CHANGED_SINCE,
  PAPER_RECORDED_MESSAGE,
  STUDENT_NOT_FOUND,
} from "./consent-words";
import { addTestActor, addTestPeople } from "./test-consents";

const inTestDatabase = withTestDatabase();

// 10:00 on campus on 16 October 2026, and the day after.
const MOMENT = new Date("2026-10-16T03:00:00Z");
const LATER = new Date("2026-10-17T03:00:00Z");

function addPeople(db: Database) {
  return addTestPeople(db, "Prodi Uji Ubah Persetujuan", [
    "9986201001",
    "9986201002",
  ]);
}

function logOf(db: Database) {
  return db
    .select({
      changedBy: counsellingConsentChanges.changedBy,
      changedAt: counsellingConsentChanges.changedAt,
      statusBefore: counsellingConsentChanges.statusBefore,
      statusAfter: counsellingConsentChanges.statusAfter,
      way: counsellingConsentChanges.way,
    })
    .from(counsellingConsentChanges)
    .orderBy(asc(counsellingConsentChanges.changedAt));
}

describe("Kirim permintaan persetujuan", () => {
  it("makes a student never asked Menunggu, says who it was sent to and logs it with nothing before", async () => {
    await inTestDatabase(async (db) => {
      const { counsellor, studentIds } = await addPeople(db);

      const sent = await changeConsentAsCounsellor(
        db,
        counsellor,
        studentIds[0],
        "ask",
        NO_CONSENT_VERSION,
        MOMENT,
      );

      expect(sent).toEqual({
        kind: "kept",
        done: "Permintaan persetujuan dikirim ke Mahasiswa Uji Konseling 1.",
        consent: {
          status: "waiting",
          way: null,
          changedAt: MOMENT,
          counsellorName: "Konselor Uji",
          version: MOMENT.toISOString(),
        },
      });
      expect(await logOf(db)).toEqual([
        {
          changedBy: counsellor.id,
          changedAt: MOMENT,
          statusBefore: null,
          statusAfter: "waiting",
          way: null,
        },
      ]);
    });
  });

  it("is refused a second time while the request waits, with the current status", async () => {
    await inTestDatabase(async (db) => {
      const { counsellor, studentIds } = await addPeople(db);
      const first = await changeConsentAsCounsellor(
        db,
        counsellor,
        studentIds[0],
        "ask",
        NO_CONSENT_VERSION,
        MOMENT,
      );
      if (first.kind !== "kept") throw new Error(first.error);

      const again = await changeConsentAsCounsellor(
        db,
        counsellor,
        studentIds[0],
        "ask",
        first.consent.version,
        LATER,
      );

      expect(again).toEqual({
        kind: "changed",
        error: CHANGED_SINCE,
        consent: first.consent,
      });
      expect(await logOf(db)).toHaveLength(1);
    });
  });

  it("is refused when the panel showed an older status, changing nothing", async () => {
    await inTestDatabase(async (db) => {
      const { counsellor, studentIds } = await addPeople(db);
      await changeConsentAsCounsellor(
        db,
        counsellor,
        studentIds[0],
        "record_paper",
        NO_CONSENT_VERSION,
        MOMENT,
      );

      const late = await changeConsentAsCounsellor(
        db,
        counsellor,
        studentIds[0],
        "ask",
        NO_CONSENT_VERSION,
        LATER,
      );

      expect(late).toMatchObject({
        kind: "changed",
        error: CHANGED_SINCE,
        consent: { status: "approved", way: "paper" },
      });
      expect(await logOf(db)).toHaveLength(1);
    });
  });
});

describe("Catat form tertulis", () => {
  it("makes a waiting request Disetujui on paper, by the Konselor, and logs the status before", async () => {
    await inTestDatabase(async (db) => {
      const { counsellor, studentIds } = await addPeople(db);
      const asked = await changeConsentAsCounsellor(
        db,
        counsellor,
        studentIds[0],
        "ask",
        NO_CONSENT_VERSION,
        MOMENT,
      );
      if (asked.kind !== "kept") throw new Error(asked.error);

      const recorded = await changeConsentAsCounsellor(
        db,
        counsellor,
        studentIds[0],
        "record_paper",
        asked.consent.version,
        LATER,
      );

      expect(recorded).toEqual({
        kind: "kept",
        done: PAPER_RECORDED_MESSAGE,
        consent: {
          status: "approved",
          way: "paper",
          changedAt: LATER,
          counsellorName: "Konselor Uji",
          version: LATER.toISOString(),
        },
      });
      const log = await logOf(db);
      expect(log.map((line) => [line.statusBefore, line.statusAfter])).toEqual([
        [null, "waiting"],
        ["waiting", "approved"],
      ]);
      expect(log[1]?.way).toBe("paper");
    });
  });

  it("is refused for a consent Disetujui already", async () => {
    await inTestDatabase(async (db) => {
      const { counsellor, studentIds } = await addPeople(db);
      const first = await changeConsentAsCounsellor(
        db,
        counsellor,
        studentIds[0],
        "record_paper",
        NO_CONSENT_VERSION,
        MOMENT,
      );
      if (first.kind !== "kept") throw new Error(first.error);

      const again = await changeConsentAsCounsellor(
        db,
        counsellor,
        studentIds[0],
        "record_paper",
        first.consent.version,
        LATER,
      );

      expect(again).toMatchObject({ kind: "changed", error: CHANGED_SINCE });
      expect(await logOf(db)).toHaveLength(1);
    });
  });
});

describe("a change of a consent by Konselor", () => {
  it.each(["head_of_unit", "mentor", "student"] as const)(
    "is refused for %s, giving nothing back and changing nothing",
    async (role) => {
      await inTestDatabase(async (db) => {
        const { studentIds } = await addPeople(db);
        const other = await addTestActor(db, "Bukan Konselor", [role]);

        const refused = await changeConsentAsCounsellor(
          db,
          other,
          studentIds[0],
          "ask",
          NO_CONSENT_VERSION,
          MOMENT,
        );

        expect(refused).toEqual(NOT_ALLOWED);
        expect(await logOf(db)).toEqual([]);
      });
    },
  );

  it.each(["not-an-id", "00000000-0000-4000-8000-000000000000", 42])(
    "is refused for %s, which is no student",
    async (studentId) => {
      await inTestDatabase(async (db) => {
        const { counsellor } = await addPeople(db);

        const refused = await changeConsentAsCounsellor(
          db,
          counsellor,
          studentId,
          "ask",
          NO_CONSENT_VERSION,
          MOMENT,
        );

        expect(refused).toEqual({
          kind: "refused",
          error: STUDENT_NOT_FOUND,
        });
      });
    },
  );

  it("is refused for a removed student", async () => {
    await inTestDatabase(async (db) => {
      const { counsellor, studentIds } = await addPeople(db);
      const [removed] = studentIds;
      if (!removed) throw new Error("Student missing.");
      await db
        .update(students)
        .set({ deletedAt: MOMENT })
        .where(eq(students.id, removed));

      const refused = await changeConsentAsCounsellor(
        db,
        counsellor,
        removed,
        "ask",
        NO_CONSENT_VERSION,
        LATER,
      );

      expect(refused).toMatchObject({
        kind: "refused",
        error: STUDENT_NOT_FOUND,
      });
    });
  });

  it("is refused for a version that is no text", async () => {
    await inTestDatabase(async (db) => {
      const { counsellor, studentIds } = await addPeople(db);

      const refused = await changeConsentAsCounsellor(
        db,
        counsellor,
        studentIds[0],
        "ask",
        undefined,
        MOMENT,
      );

      expect(refused).toEqual({
        kind: "changed",
        error: CHANGED_SINCE,
        consent: null,
      });
    });
  });
});
