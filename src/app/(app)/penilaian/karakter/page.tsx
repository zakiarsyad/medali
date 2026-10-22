import { forbidden } from "next/navigation";
import type { ReactNode } from "react";
import { campusDay } from "@/academic-periods/campus-day";
import { periodTitle } from "@/academic-periods/period-labels";
import { type AccountForAccess, may } from "@/auth/access";
import { openPage } from "@/auth/open-page";
import { visibleTo } from "@/auth/visible-students";
import {
  type ClosedPeriod,
  chosenClosed,
  readClosedPeriods,
} from "@/character-grades/closed-semesters";
import { readFixedGradeTab } from "@/character-grades/fixed-grade-tab";
import { readGradeBasis } from "@/character-grades/grade-facts";
import type { GradeList } from "@/character-grades/grade-list";
import type { GradeNumbers } from "@/character-grades/grade-numbers";
import { readGradePage } from "@/character-grades/grade-page";
import { readGradeScheme } from "@/character-grades/grade-scheme";
import { gradeVisibleTo } from "@/character-grades/grade-students";
import { fixedGradeLine } from "@/character-grades/grade-words";
import { readGradeNumbers } from "@/character-grades/read-grade-numbers";
import type { GradeLetter } from "@/character-grades/scheme-ids";
import { database } from "@/db/database";
import { StudentSanctionBadge } from "@/discipline-penalties/student-sanction-badge";
import { ScoreHistoryPanel } from "@/features/character-assessment/score-history-panel";
import { StudentAchievementPanel } from "@/features/character-assessment/student-achievement-panel";
import { CharacterGradeScreen } from "@/features/character-grades/character-grade-screen";
import {
  type GradeParams,
  gradeAddress,
  readGradeParams,
} from "@/features/character-grades/grade-address";
import { GradeNumberCards } from "@/features/character-grades/grade-number-cards";
import {
  ClosedScheme,
  ReadOnlyScheme,
} from "@/features/character-grades/read-only-scheme";
import { SchemeForm } from "@/features/character-grades/scheme-form";
import { SemesterChoice } from "@/features/character-grades/semester-choice";
import { StudentGradePanel } from "@/features/character-grades/student-grade-panel";
import { StudentMentalPanel } from "@/features/counselling/student-mental-panel";
import { baseScoreNow } from "@/features/curriculum/base-score-now";
import { StudentFitnessPanel } from "@/features/fitness/student-fitness-panel";
import { StudentCoachingPanel } from "@/features/guidance/student-coaching-panel";
import { StudentPenaltiesPanel } from "@/features/guidance/student-penalties-panel";
import { openGroupAddress } from "@/features/mentor-groups/open-group-address";
import { openMentorAddress } from "@/features/mentor-groups/open-mentor-address";
import { StudentNotesPanel } from "@/features/mentoring/student-notes-panel";
import { noteRowsFor } from "@/features/mentoring/visible-notes";
import { StudentSikuPanel } from "@/features/siku/student-siku-panel";
import { askedDetailOrBrief } from "@/features/students/asked-detail";
import { runningPeriodNow } from "@/features/students/running-period-now";
import { StudentDetailDialog } from "@/features/students/student-detail-dialog";
import { activeAmong } from "@/mentoring/active-member";

/** What the tab shows of the semester chosen, live or fixed. */
interface ShownGrades {
  list: GradeList;
  nameOnly: readonly string[];
  numbers: GradeNumbers;
  passLetter: GradeLetter;
  sikuBase: number | null;
  scheme: ReactNode;
  /** The line over the grades of a closed semester, or null for Berjalan. */
  line: string | null;
}

/** The running semester: every grade worked out from its parts on this load. */
async function readLiveGrades(
  account: AccountForAccess,
  params: GradeParams,
): Promise<ShownGrades> {
  const db = database();
  const inForce = await readGradeScheme(db);
  const visible = gradeVisibleTo(account);
  const today = campusDay();
  const basis = await readGradeBasis(db, inForce.scheme, today);
  const [list, numbers] = await Promise.all([
    readGradePage(db, visible, basis, today, params),
    readGradeNumbers(db, visible, basis),
  ]);
  const mayChange = may(account.roles, "set_grade_weights");
  return {
    list,
    nameOnly: [],
    numbers,
    passLetter: inForce.scheme.passLetter,
    sikuBase: basis.sikuBase,
    scheme: mayChange ? (
      <SchemeForm inForce={inForce} />
    ) : (
      <ReadOnlyScheme inForce={inForce} />
    ),
    line: null,
  };
}

/** A closed semester: the grades and the scheme its closing fixed. */
async function readClosedGrades(
  account: AccountForAccess,
  chosen: ClosedPeriod,
  params: GradeParams,
): Promise<ShownGrades> {
  const fixed = await readFixedGradeTab(
    database(),
    account,
    chosen.closingId,
    params,
  );
  if (fixed === "refused") forbidden();
  const line = fixedGradeLine(periodTitle(chosen.period), chosen.closedAt);
  return {
    list: fixed.list,
    nameOnly: fixed.list.nameOnly,
    numbers: fixed.numbers,
    passLetter: chosen.scheme.passLetter,
    sikuBase: fixed.sikuBase,
    scheme: <ClosedScheme scheme={chosen.scheme} line={line} />,
    line,
  };
}

/**
 * The tab Penilaian karakter: the choice "Semester" once a semester is
 * closed, the four numbers, "Skema bobot", the scheme
 * of the semester character grade, and "Daftar nilai karakter". Kepala
 * Unit, with the right "Bobot penilaian", changes the scheme; every other
 * role that opens the tab only reads it. Each role sees the grades of the
 * students its roles that open the tab see: Ketua Program Studi those of
 * their own program only, Pengasuh their own mentees only. Nothing here
 * writes a grade: each is worked out on every load from its parts. A
 * name opens the student over the tab: the whole detail for a role that
 * may open it, else name, NIM, program studi, status and the character
 * panels, only for a student the list holds. Once a semester is closed,
 * the choice "Semester" shows instead the grades its closing fixed, of the
 * students the right to read them lets through, whatever their status.
 */
export default async function CharacterGradePage(
  props: PageProps<"/penilaian/karakter">,
) {
  const opened = await openPage("penilaian", "karakter");
  const { account } = opened;
  const tabs = { pagePath: "penilaian", tabs: opened.tabs, open: "karakter" };
  const asked = readGradeParams(await props.searchParams);
  const db = database();
  const closed = may(account.roles, "view_fixed_grades")
    ? await readClosedPeriods(db)
    : [];
  const chosen = chosenClosed(closed, asked.semester);
  const params = { ...asked, semester: chosen?.period.id ?? null };
  const visible = gradeVisibleTo(account);
  const [shown, detail] = await Promise.all([
    chosen === null
      ? readLiveGrades(account, params)
      : readClosedGrades(account, chosen, params),
    askedDetailOrBrief(account, params.profileId, activeAmong(visible)),
  ]);
  const noteLimit = noteRowsFor(account);
  const notesVisible = noteLimit === null ? null : visibleTo(noteLimit);
  return (
    <>
      <CharacterGradeScreen
        tabs={tabs}
        semester={
          closed.length > 0 && (
            <SemesterChoice
              closed={closed.map((each) => ({
                id: each.period.id,
                title: periodTitle(each.period),
              }))}
              params={params}
              line={shown.line}
            />
          )
        }
        numbers={
          <GradeNumberCards
            numbers={shown.numbers}
            passLetter={shown.passLetter}
            sikuBase={shown.sikuBase}
          />
        }
        scheme={shown.scheme}
        params={params}
        list={shown.list}
        nameOnly={shown.nameOnly}
      />
      {detail && (
        <StudentDetailDialog
          detail={detail}
          period={await runningPeriodNow()}
          openedFrom="grade_list"
          headTagsOf={(studentId) => (
            <StudentSanctionBadge account={account} studentId={studentId} />
          )}
          closeAddress={gradeAddress({ ...params, profileId: null })}
          groupAddressOf={(group) => openGroupAddress(account, group)}
          mentorAddressOf={(mentorId, group) =>
            openMentorAddress(account, mentorId, group)
          }
          morePanelsOf={(studentId) => (
            <>
              <StudentAchievementPanel
                account={account}
                studentId={studentId}
              />
              <StudentGradePanel account={account} studentId={studentId} />
              <StudentSikuPanel
                account={account}
                studentId={studentId}
                base={baseScoreNow()}
              />
              <StudentPenaltiesPanel account={account} studentId={studentId} />
              <ScoreHistoryPanel account={account} studentId={studentId} />
              <StudentCoachingPanel account={account} studentId={studentId} />
              <StudentFitnessPanel account={account} studentId={studentId} />
              <StudentMentalPanel account={account} studentId={studentId} />
              <StudentNotesPanel
                account={account}
                visible={notesVisible}
                studentId={studentId}
              />
            </>
          )}
          briefPanelsOf={(studentId) => (
            <>
              <StudentAchievementPanel
                account={account}
                studentId={studentId}
              />
              <StudentGradePanel account={account} studentId={studentId} />
              <ScoreHistoryPanel account={account} studentId={studentId} />
              <StudentMentalPanel account={account} studentId={studentId} />
            </>
          )}
        />
      )}
    </>
  );
}
