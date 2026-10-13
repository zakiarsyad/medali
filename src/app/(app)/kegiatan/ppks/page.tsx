import { openPage } from "@/auth/open-page";
import { readScheduleListParams } from "@/features/activities/schedule-list-address";
import { SchedulesScreen } from "@/features/activities/schedules-screen";

export default async function PpksSchedulesPage(
  props: PageProps<"/kegiatan/ppks">,
) {
  const opened = await openPage("kegiatan", "ppks");
  const params = readScheduleListParams(await props.searchParams);
  return (
    <SchedulesScreen
      tabs={{ pagePath: "kegiatan", tabs: opened.tabs, open: "ppks" }}
      params={params}
    />
  );
}
