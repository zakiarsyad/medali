import { forbidden } from "next/navigation";
import { campusDay } from "@/academic-periods/campus-day";
import { may, rowLimitForAction } from "@/auth/access";
import { openPage } from "@/auth/open-page";
import { visibleTo } from "@/auth/visible-students";
import { database } from "@/db/database";
import { readBaseScore } from "@/features/curriculum/stored-base-score";
import {
  HistoryPanel,
  SeenStudentsDialog,
} from "@/features/siku/history-panel";
import { OwnRequestPanels } from "@/features/siku/own-request-panels";
import { readOwnSiku } from "@/features/siku/own-siku";
import { OwnSikuScreen } from "@/features/siku/own-siku-screen";
import { RequestForm } from "@/features/siku/request-form";
import { readSikuParams } from "@/features/siku/siku-address";
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

/**
 * The tab Penilaian SIKU. Staff see the SIKU of the students they may
 * see through the roles that read it: Ketua Program Studi those of their
 * own program only, Pengasuh their own mentees only. A student sees only
 * their own SIKU, whatever the address asks for. Nilai dasar is the one
 * set in Kurikulum.
 */
export default async function SikuPage(props: PageProps<"/penilaian/siku">) {
  const opened = await openPage("penilaian", "siku");
  const { account } = opened;
  const tabs = { pagePath: "penilaian", tabs: opened.tabs, open: "siku" };
  const db = database();
  const { score: base } = await readBaseScore(db);
  if (!may(account.roles, "view_siku")) {
    const own = await readOwnSiku(db, account);
    if (own.kind === "refused") forbidden();
    const requests = may(account.roles, "ask_siku_addition") ? (
      <OwnRequestPanels
        form={
          <RequestForm newRequestId={crypto.randomUUID()} today={campusDay()} />
        }
        list={null}
      />
    ) : null;
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
  const [numbers, ranking, list, groups, history, seen] = await Promise.all([
    readSikuNumbers(db, visible, base),
    readSikuRanking(db, visible, base, params),
    readSikuList(db, visible, base, params),
    mayAdjust ? readGroupChoices(db) : [],
    readSikuHistory(db, visible, params.historyPage),
    seenEntry === null
      ? null
      : readSeenStudents(db, visible, seenEntry, params.seenPage),
  ]);
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
        form={form}
        history={
          <HistoryPanel
            history={history}
            params={params}
            mayCancel={mayAdjust}
          />
        }
      />
      {seen && <SeenStudentsDialog seen={seen} params={params} />}
    </>
  );
}
