import type { SQL } from "drizzle-orm";
import { campusDay } from "@/academic-periods/campus-day";
import { runningPeriodOn } from "@/academic-periods/running-period";
import { readAcademicPeriods } from "@/academic-periods/stored-periods";
import { may } from "@/auth/access";
import { openPage } from "@/auth/open-page";
import type { Database } from "@/db/connect";
import { database } from "@/db/database";
import {
  type AttendanceScore,
  scorePercent,
} from "@/features/activities/attendance-score";
import { readStudentScores } from "@/features/activities/read-student-scores";
import { CharacterGradeScreen } from "@/features/character-grades/character-grade-screen";
import { readGradeParams } from "@/features/character-grades/grade-address";
import {
  type GradeParts,
  gradeInputsOf,
} from "@/features/character-grades/grade-inputs";
import {
  type AttendancePart,
  gradeListOf,
  gradeRowOf,
  type SikuPart,
} from "@/features/character-grades/grade-list";
import { GradeNumberCards } from "@/features/character-grades/grade-number-cards";
import { gradeNumbersOf } from "@/features/character-grades/grade-numbers";
import { readGradeScheme } from "@/features/character-grades/grade-scheme";
import {
  gradeVisibleTo,
  readGradeStudents,
} from "@/features/character-grades/grade-students";
import { ReadOnlyScheme } from "@/features/character-grades/read-only-scheme";
import { SchemeForm } from "@/features/character-grades/scheme-form";
import { readBaseScore } from "@/features/curriculum/stored-base-score";
import { readPeriodScores } from "@/features/mentoring/period-scores";
import { type SikuTotals, sikuOf } from "@/features/siku/siku-score";
import { readTotalsOf } from "@/features/siku/siku-totals";
import { sikuNote } from "@/features/siku/siku-words";
import { readConversion } from "@/features/skpm/skpm-conversion";
import { readSkpmScores } from "@/features/skpm/skpm-scores";

function attendanceParts(
  scores: ReadonlyMap<string, AttendanceScore>,
): Map<string, AttendancePart> {
  const parts = new Map<string, AttendancePart>();
  for (const [id, score] of scores) {
    parts.set(id, { ...score, percent: scorePercent(score) });
  }
  return parts;
}

function sikuParts(
  base: number,
  totals: ReadonlyMap<string, SikuTotals>,
): Map<string, SikuPart> {
  const parts = new Map<string, SikuPart>();
  for (const [id, each] of totals) {
    parts.set(id, {
      score: sikuOf(base, each),
      adjusted: each.gains > 0 || each.losses > 0,
      note: sikuNote(base, each),
    });
  }
  return parts;
}

function readMentoringScores(
  db: Database,
  studentIds: readonly string[],
  periodId: string | null,
): Promise<Map<string, number>> {
  if (periodId === null) return Promise.resolve(new Map());
  return readPeriodScores(db, studentIds, periodId);
}

/**
 * Each part of the grades of the students, read once for all of them,
 * never student by student, each by the area it belongs to, in the
 * period that runs on `today`.
 */
async function readGradeParts(
  db: Database,
  visible: SQL,
  studentIds: readonly string[],
  today: string,
): Promise<{ parts: GradeParts; sikuBase: number }> {
  const [periods, base, conversion] = await Promise.all([
    readAcademicPeriods(db),
    readBaseScore(db),
    readConversion(db),
  ]);
  const running = runningPeriodOn(periods, today);
  const [attendance, mentoring, siku, skpm] = await Promise.all([
    readStudentScores(db, visible, today),
    readMentoringScores(db, studentIds, running?.id ?? null),
    readTotalsOf(db, studentIds),
    readSkpmScores(db, studentIds, conversion.pointsForHundred),
  ]);
  const parts = {
    attendance: attendanceParts(attendance),
    mentoring,
    siku: sikuParts(base.score, siku),
    skpm: { uploadsInForce: skpm.uploads, scores: skpm.scores },
  };
  return { parts, sikuBase: base.score };
}

/**
 * The tab Penilaian karakter: the four numbers, "Skema bobot", the scheme
 * of the semester character grade, and "Daftar nilai karakter". Kepala
 * Unit, with the right "Bobot penilaian", changes the scheme; every other
 * role that opens the tab only reads it. Each role sees the grades of the
 * students its roles that open the tab see: Ketua Program Studi those of
 * their own program only, Pengasuh their own mentees only. Each part is
 * read here from the area it belongs to. Nothing here writes a grade:
 * each is worked out on every load from its parts.
 */
export default async function CharacterGradePage(
  props: PageProps<"/penilaian/karakter">,
) {
  const opened = await openPage("penilaian", "karakter");
  const tabs = { pagePath: "penilaian", tabs: opened.tabs, open: "karakter" };
  const params = readGradeParams(await props.searchParams);
  const db = database();
  const visible = gradeVisibleTo(opened.account);
  const [inForce, students] = await Promise.all([
    readGradeScheme(db),
    readGradeStudents(db, visible),
  ]);
  const ids = students.map((student) => student.id);
  const { parts, sikuBase } = await readGradeParts(
    db,
    visible,
    ids,
    campusDay(),
  );
  const rows = gradeInputsOf(students, parts).map((input) =>
    gradeRowOf(input, inForce.scheme),
  );
  const mayChange = may(opened.account.roles, "set_grade_weights");
  return (
    <CharacterGradeScreen
      tabs={tabs}
      numbers={
        <GradeNumberCards
          numbers={gradeNumbersOf(rows)}
          passLetter={inForce.scheme.passLetter}
          sikuBase={sikuBase}
        />
      }
      scheme={
        mayChange ? (
          <SchemeForm inForce={inForce} />
        ) : (
          <ReadOnlyScheme inForce={inForce} />
        )
      }
      params={params}
      list={gradeListOf(rows, params)}
    />
  );
}
