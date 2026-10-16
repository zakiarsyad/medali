// Sample NIMs of this file: 9986204000 to 9986204099.
import { asc } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { AccountForAccess } from "@/auth/access";
import type { Database } from "@/db/connect";
import { counsellingConsentChanges } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import {
  type ConsentOutcome,
  changeConsentAsCounsellor,
  changeOwnConsent,
  NOT_ALLOWED,
} from "./change-consent";
import { readConsentOf, readOwnConsent } from "./consent-reads";
import { NO_CONSENT_VERSION } from "./consent-view";
import {
  APPROVED_MESSAGE,
  CHANGED_SINCE,
  DECLINED_MESSAGE,
  WITHDRAWN_MESSAGE,
} from "./consent-words";
import { addTestPeople, type TestPeople } from "./test-consents";

const inTestDatabase = withTestDatabase();

// 10:00 on campus on 16, 17 and 18 October 2026.
const ASKED = new Date("2026-10-16T03:00:00Z");
const ANSWERED = new Date("2026-10-17T03:00:00Z");
const LATER = new Date("2026-10-18T03:00:00Z");

function addPeople(db: Database) {
  return addTestPeople(db, "Prodi Uji Jawab Persetujuan", [
    "9986204001",
    "9986204002",
  ]);
}

function versionOf(outcome: ConsentOutcome): string {
  if (outcome.kind !== "kept") throw new Error(outcome.error);
  return outcome.consent.version;
}

/** Konselor asks the first student, and gives the version the student sees. */
async function ask(db: Database, people: TestPeople): Promise<string> {
  const asked = await changeConsentAsCounsellor(
    db,
    people.counsellor,
    people.studentIds[0],
    "ask",
    NO_CONSENT_VERSION,
    ASKED,
  );
  return versionOf(asked);
}

function firstStudent(people: TestPeople): AccountForAccess {
  const [student] = people.students;
  if (!student) throw new Error("Student missing.");
  return student;
}

function logOf(db: Database) {
  return db
    .select({
      changedBy: counsellingConsentChanges.changedBy,
      statusBefore: counsellingConsentChanges.statusBefore,
      statusAfter: counsellingConsentChanges.statusAfter,
      way: counsellingConsentChanges.way,
    })
    .from(counsellingConsentChanges)
    .orderBy(asc(counsellingConsentChanges.changedAt));
}

describe("Setujui and Tolak", () => {
  it("Setujui makes a waiting request Disetujui online, thanks the student, and logs it as their own", async () => {
    await inTestDatabase(async (db) => {
      const people = await addPeople(db);
      const student = firstStudent(people);
      const version = await ask(db, people);

      const answer = await changeOwnConsent(
        db,
        student,
        "approve",
        version,
        ANSWERED,
      );

      expect(answer).toEqual({
        kind: "kept",
        done: APPROVED_MESSAGE,
        consent: {
          status: "approved",
          way: "online",
          changedAt: ANSWERED,
          counsellorName: null,
          version: ANSWERED.toISOString(),
        },
      });
      expect((await logOf(db)).at(-1)).toEqual({
        changedBy: student.id,
        statusBefore: "waiting",
        statusAfter: "approved",
        way: "online",
      });
    });
  });

  it("Tolak makes a waiting request Ditolak", async () => {
    await inTestDatabase(async (db) => {
      const people = await addPeople(db);
      const version = await ask(db, people);

      const answer = await changeOwnConsent(
        db,
        firstStudent(people),
        "decline",
        version,
        ANSWERED,
      );

      expect(answer).toMatchObject({
        kind: "kept",
        done: DECLINED_MESSAGE,
        consent: { status: "declined", way: null },
      });
    });
  });

  it("Setujui pressed twice keeps one change: the second is refused with the current status", async () => {
    await inTestDatabase(async (db) => {
      const people = await addPeople(db);
      const student = firstStudent(people);
      const version = await ask(db, people);
      await changeOwnConsent(db, student, "approve", version, ANSWERED);

      const again = await changeOwnConsent(
        db,
        student,
        "approve",
        version,
        LATER,
      );

      expect(again).toMatchObject({
        kind: "changed",
        error: CHANGED_SINCE,
        consent: { status: "approved", way: "online", changedAt: ANSWERED },
      });
      expect(await logOf(db)).toHaveLength(2);
    });
  });

  it("is refused for a consent that is not waiting, even with its own version", async () => {
    await inTestDatabase(async (db) => {
      const people = await addPeople(db);
      const recorded = await changeConsentAsCounsellor(
        db,
        people.counsellor,
        people.studentIds[0],
        "record_paper",
        NO_CONSENT_VERSION,
        ASKED,
      );

      const answer = await changeOwnConsent(
        db,
        firstStudent(people),
        "decline",
        versionOf(recorded),
        LATER,
      );

      expect(answer).toMatchObject({
        kind: "changed",
        consent: { status: "approved", way: "paper", counsellorName: null },
      });
      expect(await logOf(db)).toHaveLength(1);
    });
  });

  it("answers only the student's own consent: another student who sends the version finds none to answer", async () => {
    await inTestDatabase(async (db) => {
      const people = await addPeople(db);
      const version = await ask(db, people);
      const [, other] = people.students;
      if (!other) throw new Error("Student missing.");

      const answer = await changeOwnConsent(
        db,
        other,
        "approve",
        version,
        ANSWERED,
      );

      expect(answer).toEqual({
        kind: "changed",
        error: CHANGED_SINCE,
        consent: null,
      });
      expect(await readConsentOf(db, people.studentIds[0] ?? "")).toMatchObject(
        { status: "waiting" },
      );
    });
  });

  it.each(["counsellor", "head_of_unit", "mentor"] as const)(
    "is refused for %s, giving nothing back",
    async (role) => {
      await inTestDatabase(async (db) => {
        const people = await addPeople(db);
        const version = await ask(db, people);
        // The student's own account, as if it held only this other role.
        const other = { ...firstStudent(people), roles: [role] };

        expect(
          await changeOwnConsent(db, other, "approve", version, ANSWERED),
        ).toEqual(NOT_ALLOWED);
        expect(await logOf(db)).toHaveLength(1);
      });
    },
  );
});

describe("Cabut persetujuan", () => {
  it("makes a Disetujui Dicabut, keeping the earlier answers in the log", async () => {
    await inTestDatabase(async (db) => {
      const people = await addPeople(db);
      const student = firstStudent(people);
      const asked = await ask(db, people);
      const approved = await changeOwnConsent(
        db,
        student,
        "approve",
        asked,
        ANSWERED,
      );

      const withdrawn = await changeOwnConsent(
        db,
        student,
        "withdraw",
        versionOf(approved),
        LATER,
      );

      expect(withdrawn).toMatchObject({
        kind: "kept",
        done: WITHDRAWN_MESSAGE,
        consent: { status: "withdrawn", way: null },
      });
      const log = await logOf(db);
      expect(log.map((line) => [line.statusBefore, line.statusAfter])).toEqual([
        [null, "waiting"],
        ["waiting", "approved"],
        ["approved", "withdrawn"],
      ]);
    });
  });

  it("is refused for a waiting request", async () => {
    await inTestDatabase(async (db) => {
      const people = await addPeople(db);
      const version = await ask(db, people);

      const answer = await changeOwnConsent(
        db,
        firstStudent(people),
        "withdraw",
        version,
        ANSWERED,
      );

      expect(answer).toMatchObject({
        kind: "changed",
        consent: { status: "waiting" },
      });
    });
  });
});

describe("a new request after Ditolak", () => {
  it("turns the one consent back to Menunggu, and the log keeps the earlier answer", async () => {
    await inTestDatabase(async (db) => {
      const people = await addPeople(db);
      const declined = await changeOwnConsent(
        db,
        firstStudent(people),
        "decline",
        await ask(db, people),
        ANSWERED,
      );

      const again = await changeConsentAsCounsellor(
        db,
        people.counsellor,
        people.studentIds[0],
        "ask",
        versionOf(declined),
        LATER,
      );

      expect(again).toMatchObject({
        kind: "kept",
        consent: { status: "waiting", counsellorName: "Konselor Uji" },
      });
      const log = await logOf(db);
      expect(log.map((line) => line.statusAfter)).toEqual([
        "waiting",
        "declined",
        "waiting",
      ]);
    });
  });
});

describe("readOwnConsent", () => {
  it("gives the student their own consent without the Konselor's name", async () => {
    await inTestDatabase(async (db) => {
      const people = await addPeople(db);
      await ask(db, people);

      expect(await readOwnConsent(db, firstStudent(people))).toMatchObject({
        status: "waiting",
        counsellorName: null,
      });
      expect(
        await readOwnConsent(db, people.students[1] ?? people.counsellor),
      ).toBeNull();
    });
  });

  it("gives an account without the right nothing", async () => {
    await inTestDatabase(async (db) => {
      const people = await addPeople(db);
      await ask(db, people);
      const other = {
        ...firstStudent(people),
        roles: ["head_of_unit" as const],
      };

      expect(await readOwnConsent(db, other)).toBeNull();
    });
  });
});
