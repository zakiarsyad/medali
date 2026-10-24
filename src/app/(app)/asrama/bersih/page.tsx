import { forbidden } from "next/navigation";
import { campusDay } from "@/academic-periods/campus-day";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import { openPage } from "@/auth/open-page";
import { database } from "@/db/database";
import { readCleaningParams } from "@/features/dorm/cleaning-address";
import { readOwnCleaning } from "@/features/dorm/cleaning-resident";
import { CleaningResidentView } from "@/features/dorm/cleaning-resident-view";
import { CleaningScreen } from "@/features/dorm/cleaning-screen";
import { cleaningScreensOf } from "@/features/dorm/cleaning-screens";
import { readLivedInRoom } from "@/features/dorm/own-room";
import { residentHeader } from "@/features/dorm/resident-header";
import { TabbedHead } from "@/ui/tabbed-head";

/**
 * The resident part: the duties of the student's own room. Null for an
 * account whose roles give no resident part, or whose student lives in
 * no dorm today.
 */
async function residentPartOf(account: Account, today: string) {
  if (!cleaningScreensOf(account.roles).own) return null;
  const own = await readOwnCleaning(database(), account, today);
  if (own.kind === "refused") return null;
  return <CleaningResidentView own={own} />;
}

/**
 * The tab Pembersihan asrama. Staff see the places and the schedule of
 * every dorm; it shows rooms by number only, never a student, so every
 * role that may see it sees every dorm. A student who lives in the dorm
 * sees the duties of their own room, and no address can ask for another.
 * A resident who is also staff sees the resident part above the staff
 * screen.
 */
export default async function DormCleaningPage(
  props: PageProps<"/asrama/bersih">,
) {
  const opened = await openPage("asrama", "bersih");
  const { account } = opened;
  const tabs = { pagePath: "asrama", tabs: opened.tabs, open: "bersih" };
  const today = campusDay();
  const residentPart = await residentPartOf(account, today);
  if (cleaningScreensOf(account.roles).staff) {
    return (
      <CleaningScreen
        tabs={tabs}
        params={readCleaningParams(await props.searchParams, today)}
        today={today}
        rights={{
          judge: may(account.roles, "judge_dorm_cleaning"),
          validate: may(account.roles, "validate_dorm_cleaning"),
          manage: may(account.roles, "manage_dorm_cleaning"),
        }}
        ownPart={residentPart}
        ownRoom={await readLivedInRoom(database(), account.studentId, today)}
      />
    );
  }
  if (residentPart === null) forbidden();
  return (
    <>
      <TabbedHead
        title="Asrama"
        tabs={tabs}
        lede={await residentHeader(account.studentId)}
      />
      {residentPart}
    </>
  );
}
