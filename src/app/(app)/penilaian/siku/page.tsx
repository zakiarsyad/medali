import { forbidden } from "next/navigation";
import { campusDay } from "@/academic-periods/campus-day";
import { may, rowLimitForAction } from "@/auth/access";
import { openPage } from "@/auth/open-page";
import { database } from "@/db/database";
import { readBaseScore } from "@/features/curriculum/stored-base-score";
import { readSikuParams } from "@/features/siku/siku-address";
import {
  readSikuList,
  readSikuNumbers,
  readSikuRanking,
} from "@/features/siku/siku-board";
import { SikuForm } from "@/features/siku/siku-form";
import { readGroupChoices } from "@/features/siku/siku-picks";
import { StaffSikuScreen } from "@/features/siku/staff-siku-screen";
import { visibleTo } from "@/features/students/visible-students";

/**
 * The tab Penilaian SIKU. Staff see the SIKU of the students they may
 * see through the roles that read it: Ketua Program Studi those of their
 * own program only, Pengasuh their own mentees only. Nilai dasar is the
 * one set in Kurikulum.
 */
export default async function SikuPage(props: PageProps<"/penilaian/siku">) {
  const opened = await openPage("penilaian", "siku");
  const { account } = opened;
  const tabs = { pagePath: "penilaian", tabs: opened.tabs, open: "siku" };
  if (!may(account.roles, "view_siku")) forbidden();
  const db = database();
  const params = readSikuParams(await props.searchParams);
  const visible = visibleTo(rowLimitForAction(account, "view_siku"));
  const { score: base } = await readBaseScore(db);
  const mayAdjust = may(account.roles, "adjust_siku");
  const [numbers, ranking, list, groups] = await Promise.all([
    readSikuNumbers(db, visible, base),
    readSikuRanking(db, visible, base, params),
    readSikuList(db, visible, base, params),
    mayAdjust ? readGroupChoices(db) : [],
  ]);
  const form = mayAdjust ? (
    <SikuForm
      newEntryId={crypto.randomUUID()}
      base={base}
      today={campusDay()}
      groups={groups}
    />
  ) : null;
  return (
    <StaffSikuScreen
      tabs={tabs}
      params={params}
      base={base}
      numbers={numbers}
      ranking={ranking}
      list={list}
      form={form}
      history={null}
    />
  );
}
