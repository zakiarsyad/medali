import { forbidden } from "next/navigation";
import { may } from "@/auth/access";
import { openPage } from "@/auth/open-page";
import { database } from "@/db/database";
import { readHistoryPage } from "@/features/activities/history-address";
import { readStudentActivities } from "@/features/activities/student-activities";
import { StudentActivitiesScreen } from "@/features/activities/student-activities-screen";
import { EmptyPage } from "@/ui/empty-page";

/**
 * Kegiatan karakter without a tab. An account with a tab is sent to it.
 * A student sees their own activities here. Any other account that opens
 * the page and has no tab yet keeps the empty page.
 */
export default async function ActivitiesPage(props: PageProps<"/kegiatan">) {
  const { account, page } = await openPage("kegiatan");
  if (!may(account.roles, "send_attendance_photo")) {
    return <EmptyPage title={page.title} />;
  }
  const historyPage = readHistoryPage(await props.searchParams);
  const answer = await readStudentActivities(
    database(),
    account,
    new Date(),
    historyPage,
  );
  if (answer.kind === "refused") forbidden();
  return <StudentActivitiesScreen activities={answer.activities} />;
}
