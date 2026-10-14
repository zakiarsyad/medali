import { may } from "@/auth/access";
import { openPage } from "@/auth/open-page";
import { readCleaningParams } from "@/features/dorm/cleaning-address";
import { CleaningScreen } from "@/features/dorm/cleaning-screen";
import { residentHeader } from "@/features/dorm/resident-header";
import { EmptyPage } from "@/ui/empty-page";

/**
 * The tab Pembersihan asrama. Staff see the places of every dorm; it shows
 * rooms by number only, never a student, so every role that may see it
 * sees every dorm.
 */
export default async function DormCleaningPage(
  props: PageProps<"/asrama/bersih">,
) {
  const opened = await openPage("asrama", "bersih");
  const { account } = opened;
  const tabs = { pagePath: "asrama", tabs: opened.tabs, open: "bersih" };
  if (may(account.roles, "view_dorm_cleaning")) {
    return (
      <CleaningScreen
        tabs={tabs}
        params={readCleaningParams(await props.searchParams)}
        mayManage={may(account.roles, "manage_dorm_cleaning")}
      />
    );
  }
  return (
    <EmptyPage
      title={opened.page.title}
      lede={await residentHeader(account.studentId)}
      tabs={tabs}
    />
  );
}
