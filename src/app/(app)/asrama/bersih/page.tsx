import { forbidden } from "next/navigation";
import { campusDay } from "@/academic-periods/campus-day";
import { may } from "@/auth/access";
import { openPage } from "@/auth/open-page";
import { database } from "@/db/database";
import { readCleaningParams } from "@/features/dorm/cleaning-address";
import { readOwnCleaning } from "@/features/dorm/cleaning-resident";
import { CleaningResidentView } from "@/features/dorm/cleaning-resident-view";
import { CleaningScreen } from "@/features/dorm/cleaning-screen";
import { residentHeader } from "@/features/dorm/resident-header";
import { PageHead } from "@/ui/page-head";
import { TabLinks } from "@/ui/tab-links";

/**
 * The tab Pembersihan asrama. Staff see the places and the schedule of
 * every dorm; it shows rooms by number only, never a student, so every
 * role that may see it sees every dorm. A student who lives in the dorm
 * sees the duties of their own room, and no address can ask for another.
 */
export default async function DormCleaningPage(
  props: PageProps<"/asrama/bersih">,
) {
  const opened = await openPage("asrama", "bersih");
  const { account } = opened;
  const tabs = { pagePath: "asrama", tabs: opened.tabs, open: "bersih" };
  const today = campusDay();
  if (may(account.roles, "view_dorm_cleaning")) {
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
      />
    );
  }
  const own = await readOwnCleaning(database(), account, today);
  if (own.kind === "refused") forbidden();
  return (
    <>
      <PageHead title="Pembersihan asrama">
        {await residentHeader(account.studentId)}
      </PageHead>
      <TabLinks {...tabs} />
      <CleaningResidentView own={own} />
    </>
  );
}
