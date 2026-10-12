import { forbidden } from "next/navigation";
import { may, rowLimitFor } from "@/auth/access";
import { openPage } from "@/auth/open-page";
import { readRoomsParams } from "@/features/dorm/rooms-address";
import { RoomsScreen } from "@/features/dorm/rooms-screen";
import { visibleTo } from "@/features/students/visible-students";

export default async function DormRoomsPage(props: PageProps<"/asrama/kamar">) {
  const opened = await openPage("asrama", "kamar");
  const { account } = opened;
  if (!may(account.roles, "view_dorm_rooms")) forbidden();
  return (
    <RoomsScreen
      tabs={{ pagePath: "asrama", tabs: opened.tabs, open: "kamar" }}
      params={readRoomsParams(await props.searchParams)}
      visible={visibleTo(rowLimitFor(account))}
      mayManage={may(account.roles, "manage_dorm_rooms")}
    />
  );
}
