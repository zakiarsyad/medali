import { campusDay } from "@/academic-periods/campus-day";
import type { AccountForAccess } from "@/auth/access";
import { openPage } from "@/auth/open-page";
import { database } from "@/db/database";
import {
  readScreeningParams,
  type ScreeningParams,
} from "@/features/counselling/screening-address";
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
import {
  readCampusSessionCount,
  readSharedList,
} from "@/features/counselling/shared-board";
import { SharedListPanel } from "@/features/counselling/shared-list";
import type {
  SharedList,
  SharedNumbers,
} from "@/features/counselling/shared-view";

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
    readSharedList(db, account, params.page),
    readCampusSessionCount(db, account),
  ]);
  if (list === null || sessions === null) return null;
  const numbers = {
    forYou: list.matching,
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
 * checks the right again.
 */
export default async function MentalHealthPage(
  props: PageProps<"/penilaian/mental">,
) {
  const opened = await openPage("penilaian", "mental");
  const { account } = opened;
  const tabs = { pagePath: "penilaian", tabs: opened.tabs, open: "mental" };
  const params = readScreeningParams(await props.searchParams);
  const [counsellor, campusCount, recipient] = await Promise.all([
    counsellorPart(account, params),
    readCampusScreenedCount(database(), account),
    recipientPart(account, params),
  ]);
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
        <>
          {campusCount !== null && (
            <CampusScreenedCount
              shown={campusCount}
              shared={recipient?.numbers ?? null}
            />
          )}
          {recipient && <SharedListPanel list={recipient.list} />}
        </>
      }
    />
  );
}
