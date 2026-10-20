import type { AccountForAccess } from "@/auth/access";
import { openPage } from "@/auth/open-page";
import { database } from "@/db/database";
import { readScreeningParams } from "@/features/counselling/screening-address";
import {
  readScreeningList,
  readScreeningNumbers,
} from "@/features/counselling/screening-board";
import {
  type CounsellorScreenings,
  ScreeningScreen,
} from "@/features/counselling/screening-screen";
import type { SearchParams } from "@/ui/search-params";

async function counsellorPart(
  account: AccountForAccess,
  searchParams: SearchParams,
): Promise<CounsellorScreenings | null> {
  const params = readScreeningParams(searchParams);
  const db = database();
  const [numbers, list] = await Promise.all([
    readScreeningNumbers(db, account),
    readScreeningList(db, account, params),
  ]);
  if (numbers === null || list === null) return null;
  return { numbers, list, params };
}

/**
 * The tab Kesehatan mental. Konselor alone records and reads the
 * screenings, each student's by name; every read checks the right again.
 */
export default async function MentalHealthPage(
  props: PageProps<"/penilaian/mental">,
) {
  const opened = await openPage("penilaian", "mental");
  const { account } = opened;
  const tabs = { pagePath: "penilaian", tabs: opened.tabs, open: "mental" };
  const counsellor = await counsellorPart(account, await props.searchParams);
  return <ScreeningScreen tabs={tabs} counsellor={counsellor} />;
}
