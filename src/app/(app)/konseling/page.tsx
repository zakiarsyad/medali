import { campusDay } from "@/academic-periods/campus-day";
import { daysAfter } from "@/academic-periods/days-after";
import { type AccountForAccess, may } from "@/auth/access";
import { openPage } from "@/auth/open-page";
import { database } from "@/db/database";
import { readOwnConsent } from "@/features/counselling/consent-reads";
import { CounsellingScreen } from "@/features/counselling/counselling-screen";
import { readOwnSchedules } from "@/features/counselling/own-schedules";
import { readScheduleListParams } from "@/features/counselling/schedule-address";
import { readScheduleBoard } from "@/features/counselling/schedule-board";
import type { SearchParams } from "@/ui/search-params";

async function ownPart(account: AccountForAccess) {
  if (!may(account.roles, "answer_own_counselling_consent")) return null;
  return {
    consent: await readOwnConsent(database(), account),
    schedules: await readOwnSchedules(database(), account),
    tomorrow: daysAfter(campusDay(), 1),
  };
}

async function schedulesPart(account: AccountForAccess, params: SearchParams) {
  const { filter, page } = readScheduleListParams(params);
  const board = await readScheduleBoard(database(), account, { filter, page });
  return board === null ? null : { board, filter };
}

export default async function CounsellingPage(props: PageProps<"/konseling">) {
  const { account } = await openPage("konseling");
  const searchParams = await props.searchParams;
  return (
    <CounsellingScreen
      own={await ownPart(account)}
      mayManage={may(account.roles, "manage_counselling_consent")}
      schedules={await schedulesPart(account, searchParams)}
    />
  );
}
