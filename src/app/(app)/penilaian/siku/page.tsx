import { forbidden } from "next/navigation";
import { campusDay } from "@/academic-periods/campus-day";
import { may, rowLimitForAction } from "@/auth/access";
import { openPage } from "@/auth/open-page";
import { visibleTo } from "@/auth/visible-students";
import { database } from "@/db/database";
import { StudentAchievementPanel } from "@/features/character-assessment/student-achievement-panel";
import { StudentGradePanel } from "@/features/character-grades/student-grade-panel";
import { StudentMentalPanel } from "@/features/counselling/student-mental-panel";
import { readBaseScore } from "@/features/curriculum/stored-base-score";
import { StudentFitnessPanel } from "@/features/fitness/student-fitness-panel";
import { openGroupAddress } from "@/features/mentor-groups/open-group-address";
import { openMentorAddress } from "@/features/mentor-groups/open-mentor-address";
import { StudentNotesPanel } from "@/features/mentoring/student-notes-panel";
import { noteRowsFor } from "@/features/mentoring/visible-notes";
import {
  HistoryPanel,
  SeenStudentsDialog,
} from "@/features/siku/history-panel";
import { OwnRequestList } from "@/features/siku/own-request-list";
import { OwnRequestPanels } from "@/features/siku/own-request-panels";
import { readOwnRequests, waitingCount } from "@/features/siku/own-requests";
import { readOwnSiku } from "@/features/siku/own-siku";
import { OwnSikuScreen } from "@/features/siku/own-siku-screen";
import { readRequestBoard } from "@/features/siku/request-board";
import { RequestCards } from "@/features/siku/request-cards";
import { RequestForm } from "@/features/siku/request-form";
import { RequestPanel } from "@/features/siku/request-panel";
import { readSikuParams, sikuAddress } from "@/features/siku/siku-address";
import {
  readSikuList,
  readSikuNumbers,
  readSikuRanking,
} from "@/features/siku/siku-board";
import { SikuForm } from "@/features/siku/siku-form";
import {
  readSeenStudents,
  readSikuHistory,
} from "@/features/siku/siku-history";
import { SikuInputPanel } from "@/features/siku/siku-input-panel";
import { readGroupChoices } from "@/features/siku/siku-picks";
import { StaffSikuScreen } from "@/features/siku/staff-siku-screen";
import { StudentSikuPanel } from "@/features/siku/student-siku-panel";
import { askedDetailOrBrief } from "@/features/students/asked-detail";
import { runningPeriodNow } from "@/features/students/running-period-now";
import { StudentDetailDialog } from "@/features/students/student-detail-dialog";

/**
 * The tab Penilaian SIKU. Staff see the SIKU of the students they may
 * see through the roles that read it: Ketua Program Studi those of their
 * own program only, Pengasuh their own mentees only. A student sees only
 * their own SIKU, whatever the address asks for. Nilai dasar is the one
 * set in Kurikulum. A name in the lists opens the student over the tab:
 * the whole detail for a role that may open it, else name, NIM, program
 * studi and status, each with "Rincian nilai SIKU".
 */
export default async function SikuPage(props: PageProps<"/penilaian/siku">) {
  const opened = await openPage("penilaian", "siku");
  const { account } = opened;
  const tabs = { pagePath: "penilaian", tabs: opened.tabs, open: "siku" };
  const db = database();
  const { score: base } = await readBaseScore(db);
  if (!may(account.roles, "view_siku")) {
    const [own, asked] = await Promise.all([
      readOwnSiku(db, account),
      readOwnRequests(db, account),
    ]);
    if (own.kind === "refused") forbidden();
    const requests = asked && {
      waiting: waitingCount(asked),
      panels: (
        <OwnRequestPanels
          form={
            <RequestForm
              newRequestId={crypto.randomUUID()}
              today={campusDay()}
            />
          }
          list={<OwnRequestList requests={asked} />}
        />
      ),
    };
    return (
      <OwnSikuScreen
        tabs={tabs}
        base={base}
        siku={own.siku}
        requests={requests}
      />
    );
  }
  const params = readSikuParams(await props.searchParams);
  const visible = visibleTo(rowLimitForAction(account, "view_siku"));
  const mayAdjust = may(account.roles, "adjust_siku");
  const { seenEntry } = params;
  const mayDecide = may(account.roles, "decide_siku_additions");
  const [numbers, ranking, list, groups, history, seen, board, detail] =
    await Promise.all([
      readSikuNumbers(db, visible, base),
      readSikuRanking(db, visible, base, params),
      readSikuList(db, visible, base, params),
      mayAdjust ? readGroupChoices(db) : [],
      readSikuHistory(db, visible, params.historyPage),
      seenEntry === null
        ? null
        : readSeenStudents(db, visible, seenEntry, params.seenPage),
      readRequestBoard(db, visible, params.requestFilter, params.requestPage),
      askedDetailOrBrief(account, params.detailId, visible),
    ]);
  const noteLimit = noteRowsFor(account);
  const notesVisible = noteLimit === null ? null : visibleTo(noteLimit);
  const form = mayAdjust ? (
    <SikuInputPanel
      base={base}
      form={
        <SikuForm
          newEntryId={crypto.randomUUID()}
          base={base}
          today={campusDay()}
          groups={groups}
        />
      }
    />
  ) : null;
  return (
    <>
      <StaffSikuScreen
        tabs={tabs}
        params={params}
        base={base}
        numbers={numbers}
        ranking={ranking}
        list={list}
        requests={
          <RequestPanel
            board={board}
            params={params}
            mayDecide={mayDecide}
            cards={<RequestCards cards={board.cards} mayDecide={mayDecide} />}
          />
        }
        form={form}
        history={
          <HistoryPanel
            history={history}
            params={params}
            mayCancel={mayAdjust}
          />
        }
      />
      {seen && !detail && <SeenStudentsDialog seen={seen} params={params} />}
      {detail && (
        <StudentDetailDialog
          detail={detail}
          period={await runningPeriodNow()}
          openedFrom="siku_lists"
          closeAddress={sikuAddress({ ...params, detailId: null })}
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
                base={Promise.resolve(base)}
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
            <StudentSikuPanel
              account={account}
              studentId={studentId}
              base={Promise.resolve(base)}
            />
          )}
        />
      )}
    </>
  );
}
