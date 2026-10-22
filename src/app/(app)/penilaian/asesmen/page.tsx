import { periodTitle } from "@/academic-periods/period-labels";
import { readRunningPeriod } from "@/academic-periods/stored-periods";
import { may } from "@/auth/access";
import { openPage } from "@/auth/open-page";
import { visibleTo } from "@/auth/visible-students";
import type { Database } from "@/db/connect";
import { database } from "@/db/database";
import { StudentSanctionBadge } from "@/discipline-penalties/student-sanction-badge";
import {
  assessmentAddress,
  readAssessmentParams,
} from "@/features/character-assessment/assessment-address";
import {
  readAssessmentList,
  readAssessmentNumbers,
} from "@/features/character-assessment/assessment-board";
import type { LevelTexts } from "@/features/character-assessment/assessment-form";
import { readAssessmentHistory } from "@/features/character-assessment/assessment-history";
import { AssessmentHistoryDialog } from "@/features/character-assessment/assessment-history-dialog";
import { AssessmentInputPanel } from "@/features/character-assessment/assessment-input-panel";
import { readAssessmentPick } from "@/features/character-assessment/assessment-picks";
import { assessmentVisibleTo } from "@/features/character-assessment/assessment-readers";
import {
  AssessmentScreen,
  ReadOnlyNote,
} from "@/features/character-assessment/assessment-screen";
import { readCoachingList } from "@/features/character-assessment/coaching-list";
import {
  CoachingPanel,
  type CounsellingCell,
} from "@/features/character-assessment/coaching-panel";
import { ScoreHistoryPanel } from "@/features/character-assessment/score-history-panel";
import { StudentAchievementPanel } from "@/features/character-assessment/student-achievement-panel";
import { StudentGradePanel } from "@/features/character-grades/student-grade-panel";
import { AssessmentCallCell } from "@/features/counselling/assessment-call-cell";
import {
  type AssessmentCall,
  readAssessmentCalls,
} from "@/features/counselling/assessment-calls";
import { StudentMentalPanel } from "@/features/counselling/student-mental-panel";
import { baseScoreNow } from "@/features/curriculum/base-score-now";
import { readMainIndicators } from "@/features/curriculum/stored-main-indicators";
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

/**
 * The tab Asesmen karakter. Each role sees the students its roles that
 * open the tab see: Ketua Program Studi those of their own program only,
 * Pengasuh their own mentees only. Kepala Unit and Penilai Mahasiswa may
 * also enter an assessment, and alone read "Catatan penilai"; the others
 * are told who enters. "Teridentifikasi perlu pembinaan" lists, of the
 * same students, those whose latest assessment is low; only Penilai
 * Mahasiswa sees its column Konseling, with the calls read for it alone.
 * A student's earlier assessments open over the tab only for a student
 * the account sees. "Input asesmen" in a student's detail opens the form
 * with that student picked, only when the account may assess them. A
 * name in "Teridentifikasi perlu pembinaan" opens the student over the
 * tab: the whole detail for a role that may open it, else name, NIM,
 * program studi, status and the character panels, only for a student
 * the tab lists. A name in the list of assessments keeps opening the
 * earlier assessments.
 */
export default async function AssessmentPage(
  props: PageProps<"/penilaian/asesmen">,
) {
  const opened = await openPage("penilaian", "asesmen");
  const { account } = opened;
  const tabs = { pagePath: "penilaian", tabs: opened.tabs, open: "asesmen" };
  const params = readAssessmentParams(await props.searchParams);
  const db = database();
  const visible = assessmentVisibleTo(account);
  const mayAssess = may(account.roles, "assess_character");
  const running = await readRunningPeriod(db);
  const [numbers, coaching, list, history, profile] = await Promise.all([
    readAssessmentNumbers(db, visible, running?.id ?? null),
    readCoachingList(db, visible, params),
    readAssessmentList(db, visible, params),
    params.historyId === null
      ? null
      : readAssessmentHistory(db, visible, params.historyId, mayAssess),
    askedDetailOrBrief(account, params.profileId, activeAmong(visible)),
  ]);
  const calls = await readAssessmentCalls(
    db,
    account,
    coaching.rows.map((row) => row.id),
  );
  const noteLimit = noteRowsFor(account);
  const notesVisible = noteLimit === null ? null : visibleTo(noteLimit);
  return (
    <>
      <AssessmentScreen
        tabs={tabs}
        params={params}
        numbers={numbers}
        periodName={running ? periodTitle(running) : null}
        list={list}
        coaching={
          <CoachingPanel
            list={coaching}
            params={params}
            counsellingCell={callCellsOf(calls)}
          />
        }
        manage={
          mayAssess ? (
            <AssessmentInputPanel
              newAssessmentId={crypto.randomUUID()}
              levelTexts={await readLevelTexts(db)}
              startPick={
                params.pickId === null
                  ? null
                  : await readAssessmentPick(db, account, params.pickId)
              }
            />
          ) : (
            <ReadOnlyNote />
          )
        }
      />
      {profile && (
        <StudentDetailDialog
          detail={profile}
          period={await runningPeriodNow()}
          openedFrom="coaching_list"
          headTagsOf={(studentId) => (
            <StudentSanctionBadge account={account} studentId={studentId} />
          )}
          closeAddress={assessmentAddress({ ...params, profileId: null })}
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
      {history && !profile && (
        <AssessmentHistoryDialog
          history={history}
          params={params}
          withNotes={mayAssess}
        />
      )}
    </>
  );
}

/** The column Konseling, or none for an account not given the calls. */
function callCellsOf(
  calls: Map<string, AssessmentCall> | null,
): CounsellingCell | null {
  if (calls === null) return null;
  return (row) => (
    <AssessmentCallCell
      studentId={row.id}
      name={row.name}
      call={calls.get(row.id)}
    />
  );
}

/** The main indicators of Kurikulum, which name the levels of each slider. */
async function readLevelTexts(db: Database): Promise<LevelTexts> {
  const { values } = await readMainIndicators(db);
  const texts: LevelTexts = { M: [], E: [], D: [], A: [], L: [], I: [] };
  for (const value of values) {
    texts[value.key] = value.indicators.map((indicator) => indicator.text);
  }
  return texts;
}
