import { campusDay } from "@/academic-periods/campus-day";
import type { AccountForAccess } from "@/auth/access";
import { openPage } from "@/auth/open-page";
import { database } from "@/db/database";
import { readScreeningParams } from "@/features/counselling/screening-address";
import {
  readScreeningList,
  readScreeningNumbers,
} from "@/features/counselling/screening-board";
import { CampusScreenedCount } from "@/features/counselling/screening-campus";
import { readCampusScreenedCount } from "@/features/counselling/screening-count";
import { ScreeningForm } from "@/features/counselling/screening-form";
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
 * screenings, each student's by name. Kepala Unit, Direktur, Ketua
 * Program Studi and Pengasuh see only the campus count, with no names.
 * Every read checks the right again.
 */
export default async function MentalHealthPage(
  props: PageProps<"/penilaian/mental">,
) {
  const opened = await openPage("penilaian", "mental");
  const { account } = opened;
  const tabs = { pagePath: "penilaian", tabs: opened.tabs, open: "mental" };
  const counsellor = await counsellorPart(account, await props.searchParams);
  const campusCount = await readCampusScreenedCount(database(), account);
  return (
    <ScreeningScreen
      tabs={tabs}
      counsellor={counsellor}
      form={
        counsellor && (
          <ScreeningForm today={campusDay()} newKey={crypto.randomUUID()} />
        )
      }
      others={
        campusCount !== null && <CampusScreenedCount shown={campusCount} />
      }
    />
  );
}
