// Sample Tahun akademik of this file: 4102 to 4102.
// Sample NIMs of this file: 9900930000 to 9900930099.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { campusDay } from "@/academic-periods/campus-day";
import { daysAfter } from "@/academic-periods/days-after";
import { daysBefore } from "@/academic-periods/days-before";
import type { AccountForAccess } from "@/auth/access";
import { ROLE_IDS } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import {
  mentorGroupMembers,
  mentorGroupMentors,
  studentSurveyAnswers,
  studentSurveyPeriods,
  students,
} from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { readOwnSurvey } from "./own-survey";
import {
  MENTOR_CHANGED,
  NOT_ALLOWED_TO_ANSWER,
  SURVEY_CLOSED,
  sendOwnSurvey,
} from "./send-own-survey";
import { addTestActor, addTestStudent } from "./test-records";
import { addTestSurvey, studentAccount, type TestSurvey } from "./test-survey";

const inTestDatabase = withTestDatabase();

const TODAY = campusDay();
const SCORES = [5, 4, 3, 2, 1, 2, 3, 4];
const STAFF_ROLES = ROLE_IDS.filter((role) => role !== "student");

function add(db: Database, nim: string) {
  return addTestSurvey(db, { startYear: 4102, nim });
}

function sendAs(
  db: Database,
  account: AccountForAccess,
  survey: TestSurvey,
  more: Record<string, unknown> = {},
) {
  return sendOwnSurvey(db, account, {
    surveyPeriodId: survey.surveyPeriodId,
    mentorId: survey.mentorId,
    scores: SCORES,
    suggestion: "",
    ...more,
  });
}

function storedAnswers(db: Database, survey: TestSurvey) {
  return db
    .select()
    .from(studentSurveyAnswers)
    .where(eq(studentSurveyAnswers.surveyPeriodId, survey.surveyPeriodId));
}

function setPeriod(
  db: Database,
  survey: TestSurvey,
  change: Partial<typeof studentSurveyPeriods.$inferInsert>,
) {
  return db
    .update(studentSurveyPeriods)
    .set(change)
    .where(eq(studentSurveyPeriods.id, survey.surveyPeriodId));
}

/** The period when it is not Dibuka: closed by hand, past, cancelled, or not begun. */
const NOT_OPEN = {
  Ditutup: (survey: TestSurvey) => ({
    closedBy: survey.mentorId,
    closedAt: new Date(),
  }),
  Berakhir: () => ({
    startsOn: daysBefore(TODAY, 20),
    endsOn: daysBefore(TODAY, 1),
  }),
  dibatalkan: (survey: TestSurvey) => ({
    cancelledBy: survey.mentorId,
    cancelledAt: new Date(),
  }),
  Terjadwal: () => ({
    startsOn: daysAfter(TODAY, 1),
    endsOn: daysAfter(TODAY, 14),
  }),
};

describe("the survey when no period is Dibuka", () => {
  it.each(Object.keys(NOT_OPEN) as (keyof typeof NOT_OPEN)[])(
    "is not shown, and an answer sent from a form opened before gets 'Periode evaluasi sudah ditutup.', for a period that is %s",
    async (status) => {
      await inTestDatabase(async (db) => {
        const survey = await add(db, "9900930001");
        await setPeriod(db, survey, NOT_OPEN[status](survey));

        const card = await readOwnSurvey(db, survey.student, TODAY);
        const sent = await sendAs(db, survey.student, survey);

        expect(card).toBe(null);
        expect(sent).toEqual({
          ok: false,
          error: "Periode evaluasi sudah ditutup.",
        });
        expect(await storedAnswers(db, survey)).toEqual([]);
      });
    },
  );

  it("is refused for a period id that names none", async () => {
    await inTestDatabase(async (db) => {
      const survey = await add(db, "9900930002");

      const sent = await sendAs(db, survey.student, survey, {
        surveyPeriodId: "no-such-period",
      });

      expect(sent).toEqual(SURVEY_CLOSED);
      expect(await storedAnswers(db, survey)).toEqual([]);
    });
  });
});

describe("the survey of a student who may not answer", () => {
  it.each([
    ["on Cuti", "on_leave"],
    ["Non aktif", "inactive"],
  ] as const)(
    "is not shown, and an answer is refused, for a student %s",
    async (_, status) => {
      await inTestDatabase(async (db) => {
        const survey = await add(db, "9900930010");
        await db
          .update(students)
          .set({ status })
          .where(eq(students.id, survey.studentId));

        expect(await readOwnSurvey(db, survey.student, TODAY)).toBe(null);
        expect(await sendAs(db, survey.student, survey)).toEqual(
          NOT_ALLOWED_TO_ANSWER,
        );
        expect(await storedAnswers(db, survey)).toEqual([]);
      });
    },
  );

  it("is not shown, and an answer is refused, for a student in no group", async () => {
    await inTestDatabase(async (db) => {
      const survey = await add(db, "9900930011");
      await db
        .delete(mentorGroupMembers)
        .where(eq(mentorGroupMembers.studentId, survey.studentId));

      expect(await readOwnSurvey(db, survey.student, TODAY)).toBe(null);
      expect(await sendAs(db, survey.student, survey)).toEqual(
        NOT_ALLOWED_TO_ANSWER,
      );
      expect(await storedAnswers(db, survey)).toEqual([]);
    });
  });

  it("is not shown, and an answer is refused, for a student whose group has no pengasuh today", async () => {
    await inTestDatabase(async (db) => {
      const survey = await add(db, "9900930012");
      await db
        .update(mentorGroupMentors)
        .set({ endsOn: TODAY, endReason: "Uji tanpa pengasuh" })
        .where(eq(mentorGroupMentors.groupId, survey.groupId));

      expect(await readOwnSurvey(db, survey.student, TODAY)).toBe(null);
      expect(await sendAs(db, survey.student, survey)).toEqual(
        NOT_ALLOWED_TO_ANSWER,
      );
      expect(await storedAnswers(db, survey)).toEqual([]);
    });
  });
});

describe("a hand-made answer", () => {
  it("is refused for a mentor who is not the student's, and saves nothing", async () => {
    await inTestDatabase(async (db) => {
      const survey = await add(db, "9900930020");
      const other = await addTestActor(db, "Pengasuh Uji Lain", ["mentor"]);

      const sent = await sendAs(db, survey.student, survey, {
        mentorId: other.id,
      });

      expect(sent).toEqual(MENTOR_CHANGED);
      expect(await storedAnswers(db, survey)).toEqual([]);
    });
  });

  it.each([
    ["0", [0, 4, 3, 2, 1, 2, 3, 4]],
    ["6", [6, 4, 3, 2, 1, 2, 3, 4]],
    ["2.5", [2.5, 4, 3, 2, 1, 2, 3, 4]],
    ["a text", ["5", 4, 3, 2, 1, 2, 3, 4]],
  ])("is refused with a score of %s, and saves nothing", async (_, scores) => {
    await inTestDatabase(async (db) => {
      const survey = await add(db, "9900930021");

      const sent = await sendAs(db, survey.student, survey, { scores });

      expect(sent).toEqual({ ok: false, error: "Pernyataan 1 belum dijawab." });
      expect(await storedAnswers(db, survey)).toEqual([]);
    });
  });

  it("is refused when it is no answer at all", async () => {
    await inTestDatabase(async (db) => {
      const survey = await add(db, "9900930022");

      const sent = await sendOwnSurvey(db, survey.student, null);

      expect(sent.ok).toBe(false);
      expect(await storedAnswers(db, survey)).toEqual([]);
    });
  });

  it("cannot be for another student: the answer is always the sender's own", async () => {
    await inTestDatabase(async (db) => {
      const survey = await add(db, "9900930023");
      const [own] = await db
        .select({ programId: students.studyProgramId })
        .from(students)
        .where(eq(students.id, survey.studentId));
      const otherId = await addTestStudent(db, own?.programId ?? 0, {
        nim: "9900930024",
        name: "Mahasiswa Uji Lain",
      });
      await db
        .insert(mentorGroupMembers)
        .values({ studentId: otherId, groupId: survey.groupId });

      const sent = await sendAs(db, survey.student, survey, {
        studentId: otherId,
      });
      const stored = await storedAnswers(db, survey);

      expect(sent.ok).toBe(true);
      expect(stored.map((answer) => answer.studentId)).toEqual([
        survey.studentId,
      ]);
    });
  });

  it.each(STAFF_ROLES)(
    "is refused for %s, also for an account that holds a student record",
    async (role) => {
      await inTestDatabase(async (db) => {
        const survey = await add(db, "9900930030");
        const staff = { ...studentAccount(survey.studentId), roles: [role] };

        expect(await sendAs(db, staff, survey)).toEqual(NOT_ALLOWED_TO_ANSWER);
        expect(await storedAnswers(db, survey)).toEqual([]);
      });
    },
  );
});

describe("one student's answer, asked for by a staff account", () => {
  it.each(STAFF_ROLES)("is never given to %s", async (role) => {
    await inTestDatabase(async (db) => {
      const survey = await add(db, "9900930040");
      await sendAs(db, survey.student, survey);
      const staff = { ...studentAccount(survey.studentId), roles: [role] };

      expect(await readOwnSurvey(db, staff, TODAY)).toBe(null);
    });
  });
});
