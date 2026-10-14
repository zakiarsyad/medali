import { forbidden } from "next/navigation";
import { may, rowLimitForAction } from "@/auth/access";
import { openPage } from "@/auth/open-page";
import { visibleTo } from "@/auth/visible-students";
import { readCompanionsParams } from "@/features/dorm/companions-address";
import { CompanionsScreen } from "@/features/dorm/companions-screen";

export default async function DormCompanionsPage(
  props: PageProps<"/asrama/kakak">,
) {
  const opened = await openPage("asrama", "kakak");
  const { account } = opened;
  if (!may(account.roles, "view_dorm_companions")) forbidden();
  return (
    <CompanionsScreen
      tabs={{ pagePath: "asrama", tabs: opened.tabs, open: "kakak" }}
      params={readCompanionsParams(await props.searchParams)}
      visible={visibleTo(rowLimitForAction(account, "view_dorm_companions"))}
      mayManage={may(account.roles, "manage_dorm_companions")}
    />
  );
}
