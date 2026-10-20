import { campusDay } from "@/academic-periods/campus-day";
import { daysAfter } from "@/academic-periods/days-after";
import type { AccountForAccess } from "@/auth/access";
import type { Database } from "@/db/connect";
import { academicPeriods } from "@/db/schema";
import { addTestSurveyPeriod } from "@/mentoring/test-survey-periods";
import {
  addTestActor,
  addTestMentorGroup,
  addTestProgram,
  addTestStudent,
} from "./test-records";

/** Made-up survey records for the checks of the survey on Profil saya. */

export interface TestSurvey {
  surveyPeriodId: string;
  studentId: string;
  groupId: string;
  mentorId: string;
  /** The signed-in account of the student. */
  student: AccountForAccess;
}

/** A Ganjil academic period of the year, for the survey period to be about. */
async function addTestYear(db: Database, startYear: number): Promise<string> {
  const [period] = await db
    .insert(academicPeriods)
    .values({
      startYear,
      term: "odd",
      startsOn: `${startYear}-08-01`,
      endsOn: `${startYear + 1}-01-31`,
    })
    .returning({ id: academicPeriods.id });
  if (!period) throw new Error("The academic period was not added.");
  return period.id;
}

export function studentAccount(studentId: string): AccountForAccess {
  return {
    id: "00000000-0000-4000-8000-000000000000",
    roles: ["student"],
    studyProgramId: null,
    studentId,
  };
}

/**
 * An Aktif student of a group with a pengasuh, and a
 * survey period about an academic period of the year that is Dibuka
 * today, from today for 14 days.
 */
export async function addTestSurvey(
  db: Database,
  { startYear, nim }: { startYear: number; nim: string },
): Promise<TestSurvey> {
  const today = campusDay();
  const mentor = await addTestActor(db, `Pengasuh Uji ${nim}`, ["mentor"]);
  const program = await addTestProgram(db, `Prodi Uji Survei ${nim}`);
  const studentId = await addTestStudent(db, program, {
    nim,
    name: `Mahasiswa Uji ${nim}`,
  });
  const groupId = await addTestMentorGroup(db, program, {
    number: 1,
    memberIds: [studentId],
    mentorId: mentor.id,
  });
  const surveyPeriodId = await addTestSurveyPeriod(db, {
    periodId: await addTestYear(db, startYear),
    openedBy: mentor.id,
    startsOn: today,
    endsOn: daysAfter(today, 14),
  });
  return {
    surveyPeriodId,
    studentId,
    groupId,
    mentorId: mentor.id,
    student: studentAccount(studentId),
  };
}
