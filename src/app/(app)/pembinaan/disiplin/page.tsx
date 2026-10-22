import { sql } from "drizzle-orm";
import { forbidden } from "next/navigation";
import type { ReactNode } from "react";
import { campusDay } from "@/academic-periods/campus-day";
import { readAcademicPeriods } from "@/academic-periods/stored-periods";
import { may } from "@/auth/access";
import { openPage } from "@/auth/open-page";
import { visibleTo } from "@/auth/visible-students";
import { database } from "@/db/database";
import { StudentSanctionBadge } from "@/discipline-penalties/student-sanction-badge";
import { ScoreHistoryPanel } from "@/features/character-assessment/score-history-panel";
import { StudentAchievementPanel } from "@/features/character-assessment/student-achievement-panel";
import { StudentGradePanel } from "@/features/character-grades/student-grade-panel";
import { PenaltyAssignmentBox } from "@/features/counselling/penalty-assignment-box";
import { PenaltyAssignmentPart } from "@/features/counselling/penalty-assignment-part";
import {
  type PenaltyAssignment,
  readPenaltyAssignments,
} from "@/features/counselling/penalty-assignments";
import { StudentMentalPanel } from "@/features/counselling/student-mental-panel";
import { baseScoreNow } from "@/features/curriculum/base-score-now";
import { StudentFitnessPanel } from "@/features/fitness/student-fitness-panel";
import { PenaltiesScreen } from "@/features/guidance/penalties-screen";
import {
  penaltiesAddress,
  pickedStudentOf,
  readPenaltiesParams,
} from "@/features/guidance/penalty-address";
import {
  type PenaltyRow,
  readPenaltyBoard,
} from "@/features/guidance/penalty-board";
import { PenaltyForm } from "@/features/guidance/penalty-form";
import { readPenaltyStart } from "@/features/guidance/penalty-student";
import type { PenaltyCounselling } from "@/features/guidance/penalty-table";
import { StudentCoachingPanel } from "@/features/guidance/student-coaching-panel";
import { penalisedReachOf } from "@/features/guidance/student-penalties";
import { StudentPenaltiesPanel } from "@/features/guidance/student-penalties-panel";
import { openGroupAddress } from "@/features/mentor-groups/open-group-address";
import { openMentorAddress } from "@/features/mentor-groups/open-mentor-address";
import { StudentNotesPanel } from "@/features/mentoring/student-notes-panel";
import { noteRowsFor } from "@/features/mentoring/visible-notes";
import { StudentSikuPanel } from "@/features/siku/student-siku-panel";
import { askedDetailOrBrief } from "@/features/students/asked-detail";
import { runningPeriodNow } from "@/features/students/running-period-now";
import { StudentDetailDialog } from "@/features/students/student-detail-dialog";

/**
 * The tab Pelanggaran disiplin. Pembina Disiplin Mahasiswa and Kepala
 * Unit record penalties and follow them up; Direktur, Ketua Program
 * Studi and Pengasuh read them, Ketua Program Studi their own program
 * only and Pengasuh their own mentees only. No other role opens the tab.
 * Only Pembina Disiplin Mahasiswa sends a student to mandatory
 * counselling from "Rincian", with the Penugasan read for it alone.
 * A name in "Daftar pelanggaran" opens the student over the tab: the
 * whole detail for an account that may open it; for any other, name,
 * NIM, program studi, status and "Riwayat pelanggaran disiplin", only
 * for a student that list holds.
 */
export default async function DisciplinePenaltiesPage(
  props: PageProps<"/pembinaan/disiplin">,
) {
  const opened = await openPage("pembinaan", "disiplin");
  const { account } = opened;
  const search = await props.searchParams;
  const params = readPenaltiesParams(search);
  const today = campusDay();
  const board = await readPenaltyBoard(database(), account, params);
  if (board === null) forbidden();
  const form = may(account.roles, "record_discipline_penalties") ? (
    <PenaltyForm
      newKey={crypto.randomUUID()}
      today={today}
      periods={await readAcademicPeriods(database())}
      start={
        await readPenaltyStart(database(), account, pickedStudentOf(search))
      }
    />
  ) : null;
  const assignments = await readPenaltyAssignments(
    database(),
    account,
    board.list.rows.map((row) => row.id),
  );
  // An account that reads no penalties is listed nobody here to open.
  const listed = penalisedReachOf(account) ?? sql`false`;
  const profile = await askedDetailOrBrief(account, params.profileId, listed);
  const noteLimit = noteRowsFor(account);
  const notesVisible = noteLimit === null ? null : visibleTo(noteLimit);
  return (
    <>
      <PenaltiesScreen
        tabs={{ pagePath: "pembinaan", tabs: opened.tabs, open: "disiplin" }}
        board={board}
        params={params}
        form={form}
        mayFollowUp={may(account.roles, "follow_up_discipline_penalties")}
        counselling={counsellingOf(board.list.rows, assignments)}
      />
      {profile && (
        <StudentDetailDialog
          detail={profile}
          period={await runningPeriodNow()}
          openedFrom="penalty_list"
          headTagsOf={(studentId) => (
            <StudentSanctionBadge account={account} studentId={studentId} />
          )}
          closeAddress={penaltiesAddress({ ...params, profileId: null })}
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
            <StudentPenaltiesPanel account={account} studentId={studentId} />
          )}
        />
      )}
    </>
  );
}

/**
 * Mandatory counselling in "Rincian" of each penalty: the form, or how
 * its Penugasan stands. Nothing for an account not given the Penugasan
 * sent from penalties.
 */
function counsellingOf(
  rows: readonly PenaltyRow[],
  assignments: Map<string, PenaltyAssignment> | null,
): PenaltyCounselling {
  if (assignments === null) return {};
  const parts: Record<string, ReactNode> = {};
  for (const row of rows) {
    const assignment = assignments.get(row.id);
    const box = assignment ? (
      <PenaltyAssignmentBox assignment={assignment} />
    ) : null;
    parts[row.id] = (
      <PenaltyAssignmentPart penaltyId={row.id} name={row.name} box={box} />
    );
  }
  return parts;
}
