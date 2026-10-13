import { forbidden } from "next/navigation";
import { openPage } from "@/auth/open-page";
import { readMeetingsParams } from "@/features/mentoring/meetings-address";
import { MeetingsScreen } from "@/features/mentoring/meetings-screen";
import {
  attendanceRowsFor,
  filledRowsFor,
} from "@/features/mentoring/visible-attendance";

/** The tab "Pertemuan dan daftar hadir". */
export default async function MentoringMeetingsPage(
  props: PageProps<"/pengasuhan/hadir">,
) {
  const opened = await openPage("pengasuhan", "hadir");
  const { account } = opened;
  const limit = attendanceRowsFor(account);
  if (limit === null) forbidden();
  return (
    <MeetingsScreen
      tabs={{ pagePath: "pengasuhan", tabs: opened.tabs, open: "hadir" }}
      limit={limit}
      fillLimit={filledRowsFor(account)}
      params={readMeetingsParams(await props.searchParams)}
    />
  );
}
