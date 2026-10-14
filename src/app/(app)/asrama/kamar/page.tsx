import { forbidden } from "next/navigation";
import { may, rowLimitForAction } from "@/auth/access";
import { openPage } from "@/auth/open-page";
import { visibleTo } from "@/auth/visible-students";
import { readRoomsParams } from "@/features/dorm/rooms-address";
import { RoomsScreen } from "@/features/dorm/rooms-screen";

export default async function DormRoomsPage(props: PageProps<"/asrama/kamar">) {
  const opened = await openPage("asrama", "kamar");
  const { account } = opened;
  if (!may(account.roles, "view_dorm_rooms")) forbidden();
  return (
    <RoomsScreen
      tabs={{ pagePath: "asrama", tabs: opened.tabs, open: "kamar" }}
      params={readRoomsParams(await props.searchParams)}
      visible={visibleTo(rowLimitForAction(account, "view_dorm_rooms"))}
      mayManage={may(account.roles, "manage_dorm_rooms")}
    />
  );
}
