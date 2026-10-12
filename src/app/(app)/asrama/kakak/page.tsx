import { forbidden } from "next/navigation";
import { may, rowLimitFor } from "@/auth/access";
import { openPage } from "@/auth/open-page";
import { readCompanionsParams } from "@/features/dorm/companions-address";
import { CompanionsScreen } from "@/features/dorm/companions-screen";
import { visibleTo } from "@/features/students/visible-students";

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
      visible={visibleTo(rowLimitFor(account))}
    />
  );
}
