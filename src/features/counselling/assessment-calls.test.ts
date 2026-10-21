// Sample Tahun akademik of this file: 4431 to 4431.
// Sample NIMs of this file: 9986082000 to 9986082099.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { AccountForAccess } from "@/auth/access";
import type { RoleId } from "@/auth/role-ids";
import type { Scores } from "@/character-scores/assessment-score";
import type { Database } from "@/db/connect";
import { counsellingScheduleChanges, counsellingSchedules } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import {
  ALREADY_CALLED,
  CALL_NOT_ALLOWED_WORDS,
  callSent,
  NOT_LISTED,
} from "./assessment-call-words";
import { callFromAssessment, readAssessmentCalls } from "./assessment-calls";
import {
  addTestCallAssessment,
  addTestCallPeriod,
  INTENSIVE_SCORES,
} from "./test-assessment-calls";
import { addTestActor, addTestPeople } from "./test-consents";
import { addTestSchedule } from "./test-schedules";

const inTestDatabase = withTestDatabase();

/** Senin 14 September 4431, 10:00 on campus, in the odd period. */
const NOW = new Date("4431-09-14T03:00:00Z");
const NOW_DAY = "4431-09-14";
/** A day in the even period after it. */
const NEXT_PERIOD = new Date("4432-03-01T03:00:00Z");
const NEXT_PERIOD_DAY = "4432-03-01";

const INTENSIVE = INTENSIVE_SCORES;
const NOT_LISTED_SCORES: Scores = { M: 66, E: 70, D: 58, A: 72, L: 68, I: 71 };

async function addAssessment(
  db: Database,
  by: AccountForAccess,
  studentId: string,
  periodId: string,
  scores: Scores,
  enteredAt: Date,
): Promise<void> {
  await addTestCallAssessment(db, by, {
    studentId,
    periodId,
    scores,
    enteredAt,
  });
}

/**
 * Two periods, a Penilai Mahasiswa, and three students: the first listed
 * Intensif, the second assessed but not listed, the third not assessed.
 */
async function addRecords(db: Database) {
  const odd = await addTestCallPeriod(db, 4431, "odd");
  const even = await addTestCallPeriod(db, 4431, "even");
  const people = await addTestPeople(db, "Prodi Uji Panggil Konseling", [
    "9986082001",
    "9986082002",
    "9986082003",
  ]);
  const [listed, notListed, none] = people.studentIds;
  if (!listed || !notListed || !none) throw new Error("Students missing.");
  const penilai = await addTestActor(db, "Penilai Uji Panggil", ["assessor"]);
  const before = new Date("4431-09-01T03:00:00Z");
  await addAssessment(db, penilai, listed, odd, INTENSIVE, before);
  await addAssessment(db, penilai, notListed, odd, NOT_LISTED_SCORES, before);
  return { odd, even, people, listed, notListed, none, penilai };
}

async function callsOf(db: Database, studentId: string) {
  return db
    .select()
    .from(counsellingSchedules)
    .where(eq(counsellingSchedules.studentId, studentId));
}

async function linesOf(db: Database, scheduleId: string) {
  return db
    .select()
    .from(counsellingScheduleChanges)
    .where(eq(counsellingScheduleChanges.scheduleId, scheduleId));
}

describe("Panggil konseling from Asesmen karakter", () => {
  it("makes a Pemanggilan for Konselor, Menunggu jadwal, with the reason as Dasar, and a line in its log", async () => {
    await inTestDatabase(async (db) => {
      const { listed, penilai } = await addRecords(db);

      const outcome = await callFromAssessment(db, penilai, listed, NOW);

      expect(outcome).toEqual({
        kind: "kept",
        done: callSent("Mahasiswa Uji Konseling 1"),
      });
      const [call, ...more] = await callsOf(db, listed);
      expect(more).toEqual([]);
      expect(call).toMatchObject({
        kind: "called",
        status: "awaiting",
        topic: null,
        day: null,
        hour: null,
        way: null,
        basis:
          "Asesmen karakter: rerata 58,3, pembinaan intensif, aspek terlemah Mandiri",
        senderMessage: null,
        changedBy: penilai.id,
        createdAt: NOW,
      });
      expect(await linesOf(db, call?.id ?? "")).toEqual([
        expect.objectContaining({
          changedBy: penilai.id,
          changedAt: NOW,
          step: "call",
          statusBefore: null,
          statusAfter: "awaiting",
        }),
      ]);
    });
  });

  it.each<RoleId>(["head_of_unit", "mentor", "student", "counsellor"])(
    "refuses %s, keeping nothing",
    async (role) => {
      await inTestDatabase(async (db) => {
        const { listed } = await addRecords(db);
        const other = await addTestActor(db, "Bukan Penilai Uji", [role]);

        const outcome = await callFromAssessment(db, other, listed, NOW);

        expect(outcome).toEqual({
          kind: "refused",
          error: CALL_NOT_ALLOWED_WORDS,
        });
        expect(await callsOf(db, listed)).toEqual([]);
      });
    },
  );

  it("refuses a student who is not listed, one with no assessment and an id that is none, keeping nothing", async () => {
    await inTestDatabase(async (db) => {
      const { notListed, none, penilai } = await addRecords(db);

      for (const studentId of [notListed, none, "bukan-id"]) {
        expect(await callFromAssessment(db, penilai, studentId, NOW)).toEqual({
          kind: "refused",
          error: NOT_LISTED,
        });
      }
      expect(await callsOf(db, notListed)).toEqual([]);
      expect(await callsOf(db, none)).toEqual([]);
    });
  });

  it("makes one call per student in a period, whatever its status and also after a new assessment", async () => {
    await inTestDatabase(async (db) => {
      const { odd, listed, penilai } = await addRecords(db);
      const penilaiLain = await addTestActor(db, "Penilai Uji Lain", [
        "assessor",
      ]);
      await callFromAssessment(db, penilai, listed, NOW);

      const again = await callFromAssessment(db, penilaiLain, listed, NOW);
      await db
        .update(counsellingSchedules)
        .set({
          status: "done",
          day: "4431-09-16",
          hour: "10:00",
          way: "in_person",
          counsellorId: penilai.id,
        })
        .where(eq(counsellingSchedules.studentId, listed));
      const later = new Date("4431-10-01T03:00:00Z");
      await addAssessment(db, penilai, listed, odd, INTENSIVE, later);
      const afterDone = await callFromAssessment(db, penilai, listed, later);

      expect(again).toEqual({ kind: "refused", error: ALREADY_CALLED });
      expect(afterDone).toEqual({ kind: "refused", error: ALREADY_CALLED });
      expect(await callsOf(db, listed)).toHaveLength(1);
    });
  });

  it("is not blocked by an active voluntary request", async () => {
    await inTestDatabase(async (db) => {
      const { people, listed, penilai } = await addRecords(db);
      await addTestSchedule(db, {
        studentId: listed,
        studentAccountId: people.students[0]?.id ?? "",
        day: "4431-09-15",
        at: NOW,
      });

      const outcome = await callFromAssessment(db, penilai, listed, NOW);

      expect(outcome.kind).toBe("kept");
      expect(await callsOf(db, listed)).toHaveLength(2);
    });
  });

  it("allows a new call in a new period while the student is still listed", async () => {
    await inTestDatabase(async (db) => {
      const { listed, penilai } = await addRecords(db);
      await callFromAssessment(db, penilai, listed, NOW);

      const before = await readAssessmentCalls(
        db,
        penilai,
        [listed],
        NEXT_PERIOD_DAY,
      );
      const outcome = await callFromAssessment(
        db,
        penilai,
        listed,
        NEXT_PERIOD,
      );

      expect(before).toEqual(new Map());
      expect(outcome.kind).toBe("kept");
      expect(await callsOf(db, listed)).toHaveLength(2);
    });
  });
});

describe("how a call from Asesmen karakter stands", () => {
  it("shows Penilai Mahasiswa the status of the call of this period, and its date and Jam once Konselor set them", async () => {
    await inTestDatabase(async (db) => {
      const { listed, notListed, penilai } = await addRecords(db);
      await callFromAssessment(db, penilai, listed, NOW);
      const ids = [listed, notListed];

      const waiting = await readAssessmentCalls(db, penilai, ids, NOW_DAY);
      await db
        .update(counsellingSchedules)
        .set({
          status: "scheduled",
          day: "4431-09-16",
          hour: "10:00",
          way: "online",
          counsellorId: penilai.id,
        })
        .where(eq(counsellingSchedules.studentId, listed));
      const scheduled = await readAssessmentCalls(db, penilai, ids, NOW_DAY);
      await db
        .update(counsellingSchedules)
        .set({ status: "reschedule_asked", day: "4431-09-18" })
        .where(eq(counsellingSchedules.studentId, listed));
      const asked = await readAssessmentCalls(db, penilai, ids, NOW_DAY);

      expect(waiting).toEqual(
        new Map([[listed, { status: "awaiting", day: null, hour: null }]]),
      );
      expect(scheduled).toEqual(
        new Map([
          [listed, { status: "scheduled", day: "4431-09-16", hour: "10:00" }],
        ]),
      );
      expect(asked).toEqual(
        new Map([
          [listed, { status: "reschedule_asked", day: null, hour: null }],
        ]),
      );
    });
  });

  it.each<RoleId>([
    "head_of_unit",
    "director",
    "head_of_program",
    "mentor",
    "counsellor",
    "student",
  ])("refuses %s", async (role) => {
    await inTestDatabase(async (db) => {
      const { listed, penilai } = await addRecords(db);
      await callFromAssessment(db, penilai, listed, NOW);
      const other = await addTestActor(db, "Bukan Penilai Uji", [role]);

      expect(
        await readAssessmentCalls(db, other, [listed], NOW_DAY),
      ).toBeNull();
    });
  });
});
