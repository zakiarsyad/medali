// Sample NIMs of this file: 9986205000 to 9986205099.
import { asc } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { AccountForAccess } from "@/auth/access";
import type { Database } from "@/db/connect";
import {
  counsellingConsentChanges,
  counsellingScheduleChanges,
  counsellingSchedules,
} from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { changeConsentAsCounsellor, changeOwnConsent } from "./change-consent";
import { readConsentOf } from "./consent-reads";
import { NO_CONSENT_VERSION } from "./consent-view";
import { readOwnSchedules } from "./own-schedules";
import {
  REGISTER_NOT_ALLOWED,
  registerCounselling,
} from "./register-counselling";
import {
  PICK_FROM_TOMORROW,
  REGISTERED,
  STILL_ACTIVE,
  TICK_CONSENT,
  WEEKDAYS_ONLY,
} from "./schedule-words";
import { addTestPeople, type TestPeople } from "./test-consents";

const inTestDatabase = withTestDatabase();

// Selasa 20 October 2026, 10:00 on campus, and a day before it.
const NOW = new Date("2026-10-20T03:00:00Z");
const EARLIER = new Date("2026-10-19T03:00:00Z");

const SENT = {
  topic: "academic",
  day: "2026-10-21",
  hour: "10:00",
  way: "in_person",
  story: "Cerita uji.",
  consented: true,
};

function addPeople(db: Database) {
  return addTestPeople(db, "Prodi Uji Daftar Konseling", [
    "9986205001",
    "9986205002",
  ]);
}

function studentOf(people: TestPeople, place = 0): AccountForAccess {
  const student = people.students[place];
  if (!student) throw new Error("Student missing.");
  return student;
}

function schedulesOf(db: Database) {
  return db.select().from(counsellingSchedules);
}

function scheduleLogOf(db: Database) {
  return db
    .select()
    .from(counsellingScheduleChanges)
    .orderBy(asc(counsellingScheduleChanges.changedAt));
}

function consentLogOf(db: Database) {
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

describe("Daftar konseling", () => {
  it("keeps a Diajukan request with a log line, and makes a consent never asked Disetujui by registration", async () => {
    await inTestDatabase(async (db) => {
      const people = await addPeople(db);
      const student = studentOf(people);

      const answer = await registerCounselling(db, student, SENT, NOW);

      expect(answer).toEqual({ kind: "kept", done: REGISTERED });
      const [kept] = await schedulesOf(db);
      expect(kept).toMatchObject({
        studentId: student.studentId,
        kind: "voluntary",
        status: "submitted",
        topic: "academic",
        day: "2026-10-21",
        hour: "10:00",
        way: "in_person",
        story: "Cerita uji.",
        counsellorId: null,
      });
      expect(await scheduleLogOf(db)).toEqual([
        expect.objectContaining({
          scheduleId: kept?.id,
          changedBy: student.id,
          changedAt: NOW,
          step: "register",
          statusBefore: null,
          statusAfter: "submitted",
        }),
      ]);
      expect(await readConsentOf(db, student.studentId ?? "")).toMatchObject({
        status: "approved",
        way: "registration",
      });
      expect(await consentLogOf(db)).toEqual([
        {
          changedBy: student.id,
          statusBefore: null,
          statusAfter: "approved",
          way: "registration",
        },
      ]);
    });
  });

  it("makes a waiting consent Disetujui, and the log keeps the request", async () => {
    await inTestDatabase(async (db) => {
      const people = await addPeople(db);
      await changeConsentAsCounsellor(
        db,
        people.counsellor,
        people.studentIds[0],
        "ask",
        NO_CONSENT_VERSION,
        EARLIER,
      );

      await registerCounselling(db, studentOf(people), SENT, NOW);

      const log = await consentLogOf(db);
      expect(log.map((line) => [line.statusBefore, line.statusAfter])).toEqual([
        [null, "waiting"],
        ["waiting", "approved"],
      ]);
      expect(log.at(-1)?.way).toBe("registration");
    });
  });

  it("makes a declined consent Disetujui", async () => {
    await inTestDatabase(async (db) => {
      const people = await addPeople(db);
      const asked = await changeConsentAsCounsellor(
        db,
        people.counsellor,
        people.studentIds[0],
        "ask",
        NO_CONSENT_VERSION,
        EARLIER,
      );
      if (asked.kind !== "kept") throw new Error(asked.error);
      await changeOwnConsent(
        db,
        studentOf(people),
        "decline",
        asked.consent.version,
        EARLIER,
      );

      await registerCounselling(db, studentOf(people), SENT, NOW);

      expect(await readConsentOf(db, people.studentIds[0] ?? "")).toMatchObject(
        { status: "approved", way: "registration" },
      );
      expect(await consentLogOf(db)).toHaveLength(3);
    });
  });

  it("leaves a consent that is Disetujui already as it is, with no new log line", async () => {
    await inTestDatabase(async (db) => {
      const people = await addPeople(db);
      await changeConsentAsCounsellor(
        db,
        people.counsellor,
        people.studentIds[0],
        "record_paper",
        NO_CONSENT_VERSION,
        EARLIER,
      );

      await registerCounselling(db, studentOf(people), SENT, NOW);

      expect(await readConsentOf(db, people.studentIds[0] ?? "")).toMatchObject(
        { status: "approved", way: "paper" },
      );
      expect(await consentLogOf(db)).toHaveLength(1);
    });
  });

  it.each([
    [{ day: "2026-10-20" }, PICK_FROM_TOMORROW],
    [{ day: "2026-10-24" }, WEEKDAYS_ONLY],
    [{ consented: false }, TICK_CONSENT],
  ])("saves nothing for %o, and says %s", async (wrong, error) => {
    await inTestDatabase(async (db) => {
      const people = await addPeople(db);

      const answer = await registerCounselling(
        db,
        studentOf(people),
        { ...SENT, ...wrong },
        NOW,
      );

      expect(answer).toEqual({ kind: "refused", error });
      expect(await schedulesOf(db)).toEqual([]);
      expect(await consentLogOf(db)).toEqual([]);
    });
  });

  it("pressed twice keeps one request: the second is refused while the first is active", async () => {
    await inTestDatabase(async (db) => {
      const people = await addPeople(db);
      const student = studentOf(people);
      await registerCounselling(db, student, SENT, NOW);

      const again = await registerCounselling(
        db,
        student,
        { ...SENT, day: "2026-10-22" },
        NOW,
      );

      expect(again).toEqual({ kind: "refused", error: STILL_ACTIVE });
      expect(await schedulesOf(db)).toHaveLength(1);
      expect(await scheduleLogOf(db)).toHaveLength(1);
    });
  });

  it.each([
    "counsellor",
    "head_of_unit",
    "mentor",
    "discipline_officer",
  ] as const)("is refused for %s, saving nothing", async (role) => {
    await inTestDatabase(async (db) => {
      const people = await addPeople(db);
      // The student's own account, as if it held only this other role.
      const other = { ...studentOf(people), roles: [role] };

      expect(await registerCounselling(db, other, SENT, NOW)).toEqual(
        REGISTER_NOT_ALLOWED,
      );
      expect(await schedulesOf(db)).toEqual([]);
    });
  });
});

describe("Jadwal konseling saya", () => {
  it("gives the student their own requests only, without the story", async () => {
    await inTestDatabase(async (db) => {
      const people = await addPeople(db);
      await registerCounselling(db, studentOf(people), SENT, NOW);

      const own = await readOwnSchedules(db, studentOf(people));

      expect(own).toEqual([
        {
          id: expect.any(String),
          status: "submitted",
          topic: "academic",
          day: "2026-10-21",
          hour: "10:00",
          way: "in_person",
          counsellorName: null,
          counsellorMessage: null,
          version: NOW.toISOString(),
        },
      ]);
      expect(await readOwnSchedules(db, studentOf(people, 1))).toEqual([]);
    });
  });

  it.each(["counsellor", "head_of_unit", "mentor"] as const)(
    "gives %s nothing, even for its own student record",
    async (role) => {
      await inTestDatabase(async (db) => {
        const people = await addPeople(db);
        await registerCounselling(db, studentOf(people), SENT, NOW);
        const other = { ...studentOf(people), roles: [role] };

        expect(await readOwnSchedules(db, other)).toEqual([]);
      });
    },
  );
});
