import { forbidden } from "next/navigation";
import { openPage } from "@/auth/open-page";
import { openGroupAddress } from "@/features/mentor-groups/open-group-address";
import { openMentorAddress } from "@/features/mentor-groups/open-mentor-address";
import {
  readScoresParams,
  scoresAddress,
} from "@/features/mentoring/scores-address";
import { ScoresScreen } from "@/features/mentoring/scores-screen";
import { StudentNotesPanel } from "@/features/mentoring/student-notes-panel";
import { noteRowsFor } from "@/features/mentoring/visible-notes";
import {
  givenRowsFor,
  scoreRowsFor,
} from "@/features/mentoring/visible-scores";
import { askedDetail } from "@/features/students/asked-detail";
import { runningPeriodNow } from "@/features/students/running-period-now";
import { StudentDetailDialog } from "@/features/students/student-detail-dialog";
import {
  detailVisibleTo,
  visibleTo,
} from "@/features/students/visible-students";

/**
 * The tab "Nilai pengasuhan", with the detail of a mentee over it when
 * the address asks for one. The detail opens only for a student the
 * account may open: for Pengasuh, a student of a group they hold today.
 */
export default async function MentoringScoresPage(
  props: PageProps<"/pengasuhan/nilai">,
) {
  const opened = await openPage("pengasuhan", "nilai");
  const { account } = opened;
  const limit = scoreRowsFor(account);
  if (limit === null) forbidden();
  const params = readScoresParams(await props.searchParams);
  const detail = await askedDetail(account, params.detailId);
  const noteLimit = noteRowsFor(account);
  const notesVisible = noteLimit === null ? null : visibleTo(noteLimit);
  return (
    <>
      <ScoresScreen
        tabs={{ pagePath: "pengasuhan", tabs: opened.tabs, open: "nilai" }}
        limit={limit}
        giveLimit={givenRowsFor(account)}
        detailVisible={detailVisibleTo(account)}
        params={params}
      />
      {detail && (
        <StudentDetailDialog
          detail={detail}
          period={await runningPeriodNow()}
          closeAddress={scoresAddress(params.groupId)}
          groupAddressOf={(group) => openGroupAddress(account, group)}
          mentorAddressOf={(mentorId, group) =>
            openMentorAddress(account, mentorId, group)
          }
          morePanelsOf={(studentId) => (
            <StudentNotesPanel
              account={account}
              visible={notesVisible}
              studentId={studentId}
            />
          )}
        />
      )}
    </>
  );
}
