import { campusDay } from "@/academic-periods/campus-day";
import { may } from "@/auth/access";
import { openPage } from "@/auth/open-page";
import { visibleTo } from "@/auth/visible-students";
import { readGradeBasis } from "@/character-grades/grade-facts";
import { readGradePage } from "@/character-grades/grade-page";
import { readGradeScheme } from "@/character-grades/grade-scheme";
import { gradeVisibleTo } from "@/character-grades/grade-students";
import { readGradeNumbers } from "@/character-grades/read-grade-numbers";
import { database } from "@/db/database";
import { StudentAchievementPanel } from "@/features/character-assessment/student-achievement-panel";
import { CharacterGradeScreen } from "@/features/character-grades/character-grade-screen";
import {
  gradeAddress,
  readGradeParams,
} from "@/features/character-grades/grade-address";
import { GradeNumberCards } from "@/features/character-grades/grade-number-cards";
import { ReadOnlyScheme } from "@/features/character-grades/read-only-scheme";
import { SchemeForm } from "@/features/character-grades/scheme-form";
import { StudentGradePanel } from "@/features/character-grades/student-grade-panel";
import { StudentMentalPanel } from "@/features/counselling/student-mental-panel";
import { baseScoreNow } from "@/features/curriculum/base-score-now";
import { StudentFitnessPanel } from "@/features/fitness/student-fitness-panel";
import { openGroupAddress } from "@/features/mentor-groups/open-group-address";
import { openMentorAddress } from "@/features/mentor-groups/open-mentor-address";
import { StudentNotesPanel } from "@/features/mentoring/student-notes-panel";
import { noteRowsFor } from "@/features/mentoring/visible-notes";
import { StudentSikuPanel } from "@/features/siku/student-siku-panel";
import { askedDetailOrBrief } from "@/features/students/asked-detail";
import { runningPeriodNow } from "@/features/students/running-period-now";
import { StudentDetailDialog } from "@/features/students/student-detail-dialog";
import { activeAmong } from "@/mentoring/active-member";

/**
 * The tab Penilaian karakter: the four numbers, "Skema bobot", the scheme
 * of the semester character grade, and "Daftar nilai karakter". Kepala
 * Unit, with the right "Bobot penilaian", changes the scheme; every other
 * role that opens the tab only reads it. Each role sees the grades of the
 * students its roles that open the tab see: Ketua Program Studi those of
 * their own program only, Pengasuh their own mentees only. Nothing here
 * writes a grade: each is worked out on every load from its parts. A
 * name opens the student over the tab: the whole detail for a role that
 * may open it, else name, NIM, program studi, status and the character
 * panels, only for a student the list holds.
 */
export default async function CharacterGradePage(
  props: PageProps<"/penilaian/karakter">,
) {
  const opened = await openPage("penilaian", "karakter");
  const { account } = opened;
  const tabs = { pagePath: "penilaian", tabs: opened.tabs, open: "karakter" };
  const params = readGradeParams(await props.searchParams);
  const db = database();
  const inForce = await readGradeScheme(db);
  const visible = gradeVisibleTo(account);
  const today = campusDay();
  const basis = await readGradeBasis(db, inForce.scheme, today);
  const [list, numbers, detail] = await Promise.all([
    readGradePage(db, visible, basis, today, params),
    readGradeNumbers(db, visible, basis),
    askedDetailOrBrief(account, params.profileId, activeAmong(visible)),
  ]);
  const mayChange = may(account.roles, "set_grade_weights");
  const noteLimit = noteRowsFor(account);
  const notesVisible = noteLimit === null ? null : visibleTo(noteLimit);
  return (
    <>
      <CharacterGradeScreen
        tabs={tabs}
        numbers={
          <GradeNumberCards
            numbers={numbers}
            passLetter={inForce.scheme.passLetter}
            sikuBase={basis.sikuBase}
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
        list={list}
      />
      {detail && (
        <StudentDetailDialog
          detail={detail}
          period={await runningPeriodNow()}
          openedFrom="grade_list"
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
              <StudentMentalPanel account={account} studentId={studentId} />
            </>
          )}
        />
      )}
    </>
  );
}
