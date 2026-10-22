// Sample NIMs of this file: 9988600300 to 9988600399.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { mentalHealthScreeningLog, mentalHealthScreenings } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import {
  CONSENT_NEEDED,
  FORM_STALE,
  FUTURE_DATE,
  PICK_STUDENT,
  SCREENING_NOT_ALLOWED,
  scoreOutOfRange,
} from "@/mental-health/screening-words";
import type { ConsentStatus } from "./consent-ids";
import { STUDENT_NOT_FOUND } from "./consent-words";
import { saveScreening } from "./save-screening";
import { lookUpScreeningConsent } from "./screening-consent";
import type { SentScreening } from "./screening-input";
import { addTestActor, addTestPeople } from "./test-consents";
import { setTestConsent } from "./test-screenings";

const inTestDatabase = withTestDatabase();

// 10:00 on campus on 16 October 2026.
const NOW = new Date("2026-10-16T03:00:00Z");

function sent(
  studentId: string,
  more: Partial<SentScreening> = {},
): SentScreening {
  return {
    studentId,
    screenedOn: "2026-10-16",
    instrument: "dass21",
    depression: "11",
    anxiety: "5",
    stress: "10",
    srqYes: "",
    selfHarm: false,
    note: "Suasana hati menurun.",
    ...more,
  };
}

/** A Konselor and a student whose consent stands as given, or was never asked. */
async function addStudent(
  db: Database,
  nim: string,
  consent: ConsentStatus | null = "approved",
) {
  const people = await addTestPeople(db, `Prodi Uji Simpan ${nim}`, [nim]);
  const [studentId = ""] = people.studentIds;
  if (consent !== null) {
    await setTestConsent(db, studentId, people.counsellor.id, consent);
  }
  return { counsellor: people.counsellor, studentId };
}

async function keptOf(db: Database, studentId: string) {
  const screenings = await db
    .select()
    .from(mentalHealthScreenings)
    .where(eq(mentalHealthScreenings.studentId, studentId));
  const lines = await db
    .select()
    .from(mentalHealthScreeningLog)
    .where(eq(mentalHealthScreeningLog.studentId, studentId));
  return { screenings, lines };
}

const NOTHING = { screenings: [], lines: [] };

describe("Simpan asesmen", () => {
  it("keeps the screening with its level and note, says so, and logs who and when only", async () => {
    await inTestDatabase(async (db) => {
      const { counsellor, studentId } = await addStudent(db, "9988600301");
      const key = crypto.randomUUID();
      const outcome = await saveScreening(
        db,
        counsellor,
        key,
        sent(studentId),
        NOW,
      );
      expect(outcome).toEqual({
        kind: "kept",
        done: "Asesmen Mahasiswa Uji Konseling 1 disimpan.",
      });
      const { screenings, lines } = await keptOf(db, studentId);
      expect(screenings).toEqual([
        expect.objectContaining({
          id: key,
          screenedOn: "2026-10-16",
          instrument: "dass21",
          depression: 11,
          anxiety: 5,
          stress: 10,
          srqYes: null,
          level: "severe",
          selfHarm: false,
          note: "Suasana hati menurun.",
          savedBy: counsellor.id,
        }),
      ]);
      expect(lines).toEqual([
        {
          id: expect.any(String),
          studentId,
          event: "saved",
          by: counsellor.id,
          at: NOW,
        },
      ]);
    });
  });

  it("keeps an SRQ-20 with self-harm as Sangat berat, without DASS-21 sums", async () => {
    await inTestDatabase(async (db) => {
      const { counsellor, studentId } = await addStudent(db, "9988600302");
      const srq = sent(studentId, {
        instrument: "srq20",
        srqYes: "2",
        selfHarm: true,
      });
      await saveScreening(db, counsellor, crypto.randomUUID(), srq, NOW);
      const { screenings } = await keptOf(db, studentId);
      expect(screenings).toEqual([
        expect.objectContaining({
          instrument: "srq20",
          depression: null,
          srqYes: 2,
          selfHarm: true,
          level: "extremely_severe",
        }),
      ]);
    });
  });

  it("keeps a form sent twice once, with one log line", async () => {
    await inTestDatabase(async (db) => {
      const { counsellor, studentId } = await addStudent(db, "9988600303");
      const key = crypto.randomUUID();
      const form = sent(studentId);
      const first = await saveScreening(db, counsellor, key, form, NOW);
      const again = await saveScreening(db, counsellor, key, form, NOW);
      expect(again).toEqual(first);
      const { screenings, lines } = await keptOf(db, studentId);
      expect(screenings).toHaveLength(1);
      expect(lines).toHaveLength(1);
    });
  });

  it("refuses a key already kept for another student, saving nothing", async () => {
    await inTestDatabase(async (db) => {
      const first = await addStudent(db, "9988600308");
      const second = await addStudent(db, "9988600309");
      const key = crypto.randomUUID();
      await saveScreening(
        db,
        first.counsellor,
        key,
        sent(first.studentId),
        NOW,
      );
      const outcome = await saveScreening(
        db,
        first.counsellor,
        key,
        sent(second.studentId),
        NOW,
      );
      expect(outcome).toEqual({ kind: "refused", error: FORM_STALE });
      expect(await keptOf(db, second.studentId)).toEqual(NOTHING);
    });
  });

  it("adds a new screening for a new form, keeping the one before", async () => {
    await inTestDatabase(async (db) => {
      const { counsellor, studentId } = await addStudent(db, "9988600304");
      const form = sent(studentId);
      await saveScreening(db, counsellor, crypto.randomUUID(), form, NOW);
      await saveScreening(db, counsellor, crypto.randomUUID(), form, NOW);
      const { screenings, lines } = await keptOf(db, studentId);
      expect(screenings).toHaveLength(2);
      expect(lines).toHaveLength(2);
    });
  });

  it.each([
    ["Menunggu", "waiting"],
    ["Ditolak", "declined"],
    ["Dicabut", "withdrawn"],
    ["Belum diminta", null],
  ] as const)(
    "refuses a student whose consent is %s, saving nothing",
    async (_, consent) => {
      await inTestDatabase(async (db) => {
        const { counsellor, studentId } = await addStudent(
          db,
          "9988600305",
          consent,
        );
        const outcome = await saveScreening(
          db,
          counsellor,
          crypto.randomUUID(),
          sent(studentId),
          NOW,
        );
        expect(outcome).toEqual({ kind: "refused", error: CONSENT_NEEDED });
        expect(await keptOf(db, studentId)).toEqual(NOTHING);
      });
    },
  );

  it.each([
    [
      "a number out of range",
      { depression: "22" },
      scoreOutOfRange("Depresi", 21),
    ],
    ["a date in the future", { screenedOn: "2026-10-17" }, FUTURE_DATE],
    ["no student", { studentId: "" }, PICK_STUDENT],
  ] as const)(
    "refuses %s, saving nothing and saying why",
    async (_, wrong, error) => {
      await inTestDatabase(async (db) => {
        const { counsellor, studentId } = await addStudent(db, "9988600306");
        const outcome = await saveScreening(
          db,
          counsellor,
          crypto.randomUUID(),
          sent(studentId, wrong),
          NOW,
        );
        expect(outcome).toEqual({ kind: "refused", error });
        expect(await keptOf(db, studentId)).toEqual(NOTHING);
      });
    },
  );

  it("refuses a form without its key, and an unknown student", async () => {
    await inTestDatabase(async (db) => {
      const { counsellor, studentId } = await addStudent(db, "9988600307");
      expect(
        await saveScreening(db, counsellor, "", sent(studentId), NOW),
      ).toEqual({ kind: "refused", error: FORM_STALE });
      const unknown = sent(crypto.randomUUID());
      expect(
        await saveScreening(db, counsellor, crypto.randomUUID(), unknown, NOW),
      ).toEqual({ kind: "refused", error: STUDENT_NOT_FOUND });
    });
  });

  it.each<RoleId>([
    "head_of_unit",
    "director",
    "head_of_program",
    "mentor",
    "assessor",
    "upk_staff",
    "dorm_manager",
    "bam_health",
    "discipline_officer",
    "student",
  ])("is refused to %s, saving and sending nothing", async (role) => {
    await inTestDatabase(async (db) => {
      const { studentId } = await addStudent(db, "9988600308");
      const other = await addTestActor(db, "Bukan Konselor", [role]);
      const outcome = await saveScreening(
        db,
        other,
        crypto.randomUUID(),
        sent(studentId),
        NOW,
      );
      expect(outcome).toEqual({
        kind: "refused",
        error: SCREENING_NOT_ALLOWED,
      });
      expect(await keptOf(db, studentId)).toEqual(NOTHING);
      expect(await lookUpScreeningConsent(db, other, studentId)).toEqual({
        ok: false,
        error: STUDENT_NOT_FOUND,
      });
    });
  });
});

describe("the consent shown in the form", () => {
  it("is the student's consent to counselling, or none when never asked", async () => {
    await inTestDatabase(async (db) => {
      const asked = await addStudent(db, "9988600309", "waiting");
      const found = await lookUpScreeningConsent(
        db,
        asked.counsellor,
        asked.studentId,
      );
      expect(found).toMatchObject({ ok: true, value: { status: "waiting" } });
      const never = await addStudent(db, "9988600310", null);
      expect(
        await lookUpScreeningConsent(db, never.counsellor, never.studentId),
      ).toEqual({ ok: true, value: null });
    });
  });
});
