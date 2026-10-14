import { forbidden } from "next/navigation";
import { may } from "@/auth/access";
import { openPage } from "@/auth/open-page";
import { database } from "@/db/database";
import { pageOf } from "@/features/dorm/leave-address";
import { readOwnLeave } from "@/features/dorm/own-leave";
import { residentHeader } from "@/features/dorm/resident-header";
import { ResidentLeaveScreen } from "@/features/dorm/resident-leave-screen";
import { EmptyPage } from "@/ui/empty-page";

/**
 * The tab Perizinan asrama. A student who lives in the dorm asks for
 * leave and sees their own requests.
 */
export default async function DormLeavePage(props: PageProps<"/asrama/izin">) {
  const opened = await openPage("asrama", "izin");
  const { account } = opened;
  const tabs = { pagePath: "asrama", tabs: opened.tabs, open: "izin" };
  if (may(account.roles, "view_dorm_leave")) {
    return <EmptyPage title="Asrama" lede={null} tabs={tabs} />;
  }
  const page = pageOf(await props.searchParams);
  const answer = await readOwnLeave(database(), account, page, new Date());
  if (answer.kind === "refused") forbidden();
  return (
    <ResidentLeaveScreen
      tabs={tabs}
      room={await residentHeader(account.studentId)}
      leave={answer.leave}
      newLeaveId={crypto.randomUUID()}
    />
  );
}
