import { forbidden } from "next/navigation";
import { may, rowLimitForAction } from "@/auth/access";
import { openPage } from "@/auth/open-page";
import { visibleTo } from "@/auth/visible-students";
import { database } from "@/db/database";
import {
  readClarificationListParams,
  readRejectedPanelPage,
} from "@/features/dorm/clarification-address";
import { readClarificationBoard } from "@/features/dorm/clarification-list";
import { ClarificationsScreen } from "@/features/dorm/clarifications-screen";
import { readRejectedPanel } from "@/features/dorm/rejected-panel";
import { RejectedWarningPanel } from "@/features/dorm/rejected-panel-view";

/**
 * The tab Klarifikasi kehadiran of Asrama. Staff see the clarifications
 * of the residents they may see through the roles that may see them:
 * Ketua Program Studi those of their own program only. Only the roles
 * that check and decide them are given the files. The roles that also
 * see Pelanggaran get "Klarifikasi ditolak dan penetapan SP"; Direktur
 * and Ketua Program Studi do not.
 */
export default async function DormClarificationsPage(
  props: PageProps<"/asrama/klar">,
) {
  const opened = await openPage("asrama", "klar");
  const { account } = opened;
  if (!may(account.roles, "view_dorm_clarifications")) forbidden();
  const searchParams = await props.searchParams;
  const params = readClarificationListParams(searchParams);
  const visible = visibleTo(
    rowLimitForAction(account, "view_dorm_clarifications"),
  );
  const now = new Date();
  const [board, panel] = await Promise.all([
    readClarificationBoard(database(), visible, params.filters, params.page, {
      mayOpenFiles: may(account.roles, "open_dorm_clarification_files"),
      now,
    }),
    readRejectedPanel(
      database(),
      account,
      now,
      readRejectedPanelPage(searchParams),
    ),
  ]);
  return (
    <ClarificationsScreen
      tabs={{ pagePath: "asrama", tabs: opened.tabs, open: "klar" }}
      params={params}
      board={board}
      rights={{
        verify: may(account.roles, "verify_dorm_clarification"),
        decide: may(account.roles, "decide_dorm_clarification"),
      }}
      ownStudentId={account.studentId}
      rejectedPanel={
        panel === null ? null : (
          <RejectedWarningPanel panel={panel} params={params} />
        )
      }
    />
  );
}
