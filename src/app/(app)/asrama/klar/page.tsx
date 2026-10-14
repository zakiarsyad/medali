import { forbidden } from "next/navigation";
import { may, rowLimitForAction } from "@/auth/access";
import { openPage } from "@/auth/open-page";
import { visibleTo } from "@/auth/visible-students";
import { database } from "@/db/database";
import { readClarificationListParams } from "@/features/dorm/clarification-address";
import { readClarificationBoard } from "@/features/dorm/clarification-list";
import { ClarificationsScreen } from "@/features/dorm/clarifications-screen";

/**
 * The tab Klarifikasi kehadiran of Asrama. Staff see the clarifications
 * of the residents they may see through the roles that may see them:
 * Ketua Program Studi those of their own program only. Only the roles
 * that check and decide them are given the files.
 */
export default async function DormClarificationsPage(
  props: PageProps<"/asrama/klar">,
) {
  const opened = await openPage("asrama", "klar");
  const { account } = opened;
  if (!may(account.roles, "view_dorm_clarifications")) forbidden();
  const params = readClarificationListParams(await props.searchParams);
  const visible = visibleTo(
    rowLimitForAction(account, "view_dorm_clarifications"),
  );
  const board = await readClarificationBoard(
    database(),
    visible,
    params.filters,
    params.page,
    {
      mayOpenFiles: may(account.roles, "open_dorm_clarification_files"),
      now: new Date(),
    },
  );
  return (
    <ClarificationsScreen
      tabs={{ pagePath: "asrama", tabs: opened.tabs, open: "klar" }}
      params={params}
      board={board}
      rights={{
        verify: may(account.roles, "verify_dorm_clarification"),
        decide: may(account.roles, "decide_dorm_clarification"),
      }}
    />
  );
}
