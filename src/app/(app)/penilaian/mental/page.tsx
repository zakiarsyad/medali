import { sql } from "drizzle-orm";
import { campusDay } from "@/academic-periods/campus-day";
import type { AccountForAccess } from "@/auth/access";
import { openPage } from "@/auth/open-page";
import { visibleTo } from "@/auth/visible-students";
import { database } from "@/db/database";
import { ScoreHistoryPanel } from "@/features/character-assessment/score-history-panel";
import { StudentAchievementPanel } from "@/features/character-assessment/student-achievement-panel";
import { StudentGradePanel } from "@/features/character-grades/student-grade-panel";
import {
  readScreeningParams,
  type ScreeningParams,
  screeningAddress,
} from "@/features/counselling/screening-address";
import {
  readScreeningList,
  readScreeningNumbers,
} from "@/features/counselling/screening-board";
import { CampusScreenedCount } from "@/features/counselling/screening-campus";
import { readCampusScreenedCount } from "@/features/counselling/screening-count";
import { ScreeningForm } from "@/features/counselling/screening-form";
import { screenedReachOf } from "@/features/counselling/screening-reach";
import {
  type CounsellorScreenings,
  ScreeningScreen,
} from "@/features/counselling/screening-screen";
import {
  readCampusSessionCount,
  readSharedList,
} from "@/features/counselling/shared-board";
import { SharedListPanel } from "@/features/counselling/shared-list";
import type {
  SharedList,
  SharedNumbers,
} from "@/features/counselling/shared-view";
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

async function counsellorPart(
  account: AccountForAccess,
  params: ScreeningParams,
): Promise<CounsellorScreenings | null> {
  const db = database();
  const [numbers, list] = await Promise.all([
    readScreeningNumbers(db, account),
    readScreeningList(db, account, params),
  ]);
  if (numbers === null || list === null) return null;
  return { numbers, list, params };
}

interface RecipientPart {
  numbers: SharedNumbers;
  list: SharedList;
}

async function recipientPart(
  account: AccountForAccess,
  params: ScreeningParams,
): Promise<RecipientPart | null> {
  const db = database();
  const [list, sessions] = await Promise.all([
    readSharedList(db, account, params.sharedPage),
    readCampusSessionCount(db, account),
  ]);
  if (list === null || sessions === null) return null;
  const numbers = {
    forYou: list.matching,
    needCounselling: list.needCounselling,
    menteesOnly: list.menteesOnly,
    sessions,
  };
  return { numbers, list };
}

/**
 * The tab Kesehatan mental. Konselor alone records and reads the
 * screenings, each student's by name. Kepala Unit, Direktur, Ketua
 * Program Studi and Pengasuh see the campus counts, with no names, and
 * the students whose data Konselor published for their role. Every read
 * checks the right again. A name in Konselor's "Daftar mahasiswa"
 * opens the student over the tab: name, NIM, program studi, status and
 * "Kesehatan mental", only for a student that list holds; the whole
 * detail for an account that may open it.
 */
export default async function MentalHealthPage(
  props: PageProps<"/penilaian/mental">,
) {
  const opened = await openPage("penilaian", "mental");
  const { account } = opened;
  const tabs = { pagePath: "penilaian", tabs: opened.tabs, open: "mental" };
  const params = readScreeningParams(await props.searchParams);
  // An account that keeps no screenings is listed nobody here to open.
  const listed = screenedReachOf(account) ?? sql`false`;
  const [counsellor, campusCount, recipient, profile] = await Promise.all([
    counsellorPart(account, params),
    readCampusScreenedCount(database(), account),
    recipientPart(account, params),
    askedDetailOrBrief(account, params.profileId, listed),
  ]);
  const noteLimit = noteRowsFor(account);
  const notesVisible = noteLimit === null ? null : visibleTo(noteLimit);
  return (
    <>
      <ScreeningScreen
        tabs={tabs}
        counsellor={counsellor}
        form={
          counsellor && (
            <ScreeningForm today={campusDay()} newKey={crypto.randomUUID()} />
          )
        }
        others={
          <>
            {campusCount !== null && (
              <CampusScreenedCount
                shown={campusCount}
                shared={recipient?.numbers ?? null}
              />
            )}
            {recipient && (
              <SharedListPanel list={recipient.list} params={params} />
            )}
          </>
        }
      />
      {profile && (
        <StudentDetailDialog
          detail={profile}
          period={await runningPeriodNow()}
          openedFrom="screening_list"
          closeAddress={screeningAddress({ ...params, profileId: null })}
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
