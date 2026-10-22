import { may } from "@/auth/access";
import { openPage } from "@/auth/open-page";
import { visibleTo } from "@/auth/visible-students";
import { database } from "@/db/database";
import { ScoreHistoryPanel } from "@/features/character-assessment/score-history-panel";
import { StudentAchievementPanel } from "@/features/character-assessment/student-achievement-panel";
import { StudentGradePanel } from "@/features/character-grades/student-grade-panel";
import { StudentMentalPanel } from "@/features/counselling/student-mental-panel";
import { baseScoreNow } from "@/features/curriculum/base-score-now";
import { StudentFitnessPanel } from "@/features/fitness/student-fitness-panel";
import { openGroupAddress } from "@/features/mentor-groups/open-group-address";
import { openMentorAddress } from "@/features/mentor-groups/open-mentor-address";
import { StudentNotesPanel } from "@/features/mentoring/student-notes-panel";
import { noteRowsFor } from "@/features/mentoring/visible-notes";
import { StudentSikuPanel } from "@/features/siku/student-siku-panel";
import { readSkpmParams, skpmAddress } from "@/features/skpm/skpm-address";
import {
  readSkpmDetail,
  readSkpmList,
  readSkpmNumbers,
} from "@/features/skpm/skpm-board";
import { readConversion } from "@/features/skpm/skpm-conversion";
import { SkpmDetailDialog } from "@/features/skpm/skpm-detail-dialog";
import { SkpmManage } from "@/features/skpm/skpm-manage";
import { skpmVisibleTo } from "@/features/skpm/skpm-readers";
import { SkpmScreen } from "@/features/skpm/skpm-screen";
import { readUploadHistory } from "@/features/skpm/skpm-uploads";
import { askedDetailOrBrief } from "@/features/students/asked-detail";
import { runningPeriodNow } from "@/features/students/running-period-now";
import { StudentDetailDialog } from "@/features/students/student-detail-dialog";
import { activeAmong } from "@/mentoring/active-member";

/**
 * The tab Data SKPM. Each role sees the students its roles that open the
 * tab see: Ketua Program Studi those of their own program only, Pengasuh
 * their own mentees only. Kepala Unit and Penilai Mahasiswa may also
 * upload, remove an upload and set the conversion; the others see who
 * does. "Rincian" opens over the tab only for a student the account sees.
 * A name opens the student over the tab: the whole detail for a role
 * that may open it, else name, NIM, program studi, status and the
 * character panels, only for a student the list holds.
 */
export default async function SkpmPage(props: PageProps<"/penilaian/skpm">) {
  const opened = await openPage("penilaian", "skpm");
  const { account } = opened;
  const tabs = { pagePath: "penilaian", tabs: opened.tabs, open: "skpm" };
  const params = readSkpmParams(await props.searchParams);
  const db = database();
  const visible = skpmVisibleTo(account);
  const conversion = await readConversion(db);
  const { pointsForHundred } = conversion;
  const [numbers, list, history, detail, profile] = await Promise.all([
    readSkpmNumbers(db, visible, pointsForHundred),
    readSkpmList(db, visible, pointsForHundred, params),
    readUploadHistory(db, params.historyPage),
    params.detailId === null
      ? null
      : readSkpmDetail(db, visible, pointsForHundred, params.detailId),
    askedDetailOrBrief(account, params.profileId, activeAmong(visible)),
  ]);
  const noteLimit = noteRowsFor(account);
  const notesVisible = noteLimit === null ? null : visibleTo(noteLimit);
  return (
    <>
      <SkpmScreen
        tabs={tabs}
        params={params}
        pointsForHundred={pointsForHundred}
        numbers={numbers}
        list={list}
        manage={
          <SkpmManage
            mayUpload={may(account.roles, "upload_skpm")}
            conversion={conversion}
            history={history}
            params={params}
          />
        }
      />
      {detail && !profile && (
        <SkpmDetailDialog detail={detail} params={params} />
      )}
      {profile && (
        <StudentDetailDialog
          detail={profile}
          period={await runningPeriodNow()}
          openedFrom="skpm_list"
          closeAddress={skpmAddress({ ...params, profileId: null })}
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
