import { campusDay } from "@/academic-periods/campus-day";
import { may } from "@/auth/access";
import { openPage } from "@/auth/open-page";
import { visibleTo } from "@/auth/visible-students";
import { database } from "@/db/database";
import { ScoreHistoryPanel } from "@/features/character-assessment/score-history-panel";
import { StudentAchievementPanel } from "@/features/character-assessment/student-achievement-panel";
import { StudentGradePanel } from "@/features/character-grades/student-grade-panel";
import { StudentMentalPanel } from "@/features/counselling/student-mental-panel";
import { baseScoreNow } from "@/features/curriculum/base-score-now";
import {
  fitnessAddress,
  readFitnessParams,
} from "@/features/fitness/fitness-address";
import {
  readFitnessList,
  readFitnessNumbers,
} from "@/features/fitness/fitness-board";
import { readFitnessGroupChoices } from "@/features/fitness/fitness-groups";
import { testYearOf } from "@/features/fitness/fitness-input";
import { FitnessInputPanel } from "@/features/fitness/fitness-input-panel";
import {
  fitnessVisibleTo,
  healthReadableTo,
} from "@/features/fitness/fitness-readers";
import { FitnessScreen, ReadOnlyNote } from "@/features/fitness/fitness-screen";
import { HealthPart } from "@/features/fitness/health-part";
import { readHealthRecap } from "@/features/fitness/health-recap";
import { mayWriteNotes } from "@/features/fitness/health-subject";
import { LimitsForm } from "@/features/fitness/limits-form";
import { ReadOnlyLimits } from "@/features/fitness/read-only-limits";
import { readRecapParams } from "@/features/fitness/recap-address";
import { ScoreForm } from "@/features/fitness/score-form";
import { StudentFitnessPanel } from "@/features/fitness/student-fitness-panel";
import { StudentPenaltiesPanel } from "@/features/guidance/student-penalties-panel";
import { openGroupAddress } from "@/features/mentor-groups/open-group-address";
import { openMentorAddress } from "@/features/mentor-groups/open-mentor-address";
import { StudentNotesPanel } from "@/features/mentoring/student-notes-panel";
import { noteRowsFor } from "@/features/mentoring/visible-notes";
import { StudentSikuPanel } from "@/features/siku/student-siku-panel";
import { askedDetailOrBrief } from "@/features/students/asked-detail";
import { runningPeriodNow } from "@/features/students/running-period-now";
import { StudentDetailDialog } from "@/features/students/student-detail-dialog";
import { readFitnessLimits } from "@/health-notes/fitness-limits";
import { activeAmong } from "@/mentoring/active-member";

/**
 * The tab Penilaian jasmani. Each role sees the Aktif students its roles
 * that open the tab see: Ketua Program Studi those of their own program
 * only, Pengasuh their own mentees only. The others are told who enters
 * the scores. Kepala Unit, with the right "Bobot penilaian", alone
 * changes "Ambang skor"; every other role reads it. Kepala Unit and
 * Penilai Mahasiswa write health notes of non-dorm students. Every
 * category is the final one; the note and its mark show only on the
 * rows whose notes the account reads. Kepala Unit alone reads "Rekap
 * data kesehatan seluruh mahasiswa", and each reading is logged. A name
 * opens the student over the tab: the whole detail for a role that may
 * open it, else name, NIM, program studi, status and the character
 * panels, only for a student the list holds.
 */
export default async function FitnessPage(
  props: PageProps<"/penilaian/jasmani">,
) {
  const opened = await openPage("penilaian", "jasmani");
  const { account } = opened;
  const tabs = { pagePath: "penilaian", tabs: opened.tabs, open: "jasmani" };
  const searchParams = await props.searchParams;
  const params = readFitnessParams(searchParams);
  const recapParams = readRecapParams(searchParams);
  const db = database();
  const today = campusDay();
  const visible = fitnessVisibleTo(account);
  const inForce = await readFitnessLimits(db);
  const { limits } = inForce;
  const mayEnter = may(account.roles, "enter_fitness_scores");
  const showsNotes = may(account.roles, "view_health_notes");
  const readable = healthReadableTo(account);
  const [numbers, list, groups, recap, detail] = await Promise.all([
    readFitnessNumbers(db, visible, limits, today),
    readFitnessList(db, visible, limits, params, readable),
    mayEnter ? readFitnessGroupChoices(db) : [],
    readHealthRecap(db, account, recapParams, limits, today),
    askedDetailOrBrief(account, params.profileId, activeAmong(visible)),
  ]);
  const maySetLimits = may(account.roles, "set_grade_weights");
  const noteLimit = noteRowsFor(account);
  const notesVisible = noteLimit === null ? null : visibleTo(noteLimit);
  return (
    <>
      <FitnessScreen
        tabs={tabs}
        year={testYearOf(today)}
        numbers={numbers}
        limits={limits}
        params={params}
        list={list}
        showsNotes={showsNotes}
        manage={
          mayEnter ? (
            <FitnessInputPanel
              today={today}
              form={
                <ScoreForm
                  groups={groups}
                  today={today}
                  limits={limits}
                  newKey={crypto.randomUUID()}
                />
              }
            />
          ) : (
            <ReadOnlyNote />
          )
        }
        limitsPart={
          maySetLimits ? (
            <LimitsForm inForce={inForce} />
          ) : (
            <ReadOnlyLimits inForce={inForce} />
          )
        }
        health={
          <HealthPart
            recap={recap}
            list={params}
            recapParams={recapParams}
            writesNotes={mayWriteNotes(account.roles)}
            today={today}
          />
        }
      />
      {detail && (
        <StudentDetailDialog
          detail={detail}
          period={await runningPeriodNow()}
          openedFrom="fitness_list"
          closeAddress={fitnessAddress({ ...params, profileId: null })}
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
