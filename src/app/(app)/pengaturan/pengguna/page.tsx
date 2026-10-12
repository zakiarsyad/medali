import { forbidden } from "next/navigation";
import { may } from "@/auth/access";
import { openPage } from "@/auth/open-page";
import { readListParams } from "@/features/accounts/list-address";
import { UsersScreen } from "@/features/accounts/users-screen";

export default async function UsersPage(
  props: PageProps<"/pengaturan/pengguna">,
) {
  const opened = await openPage("pengaturan", "pengguna");
  if (!may(opened.account.roles, "manage_users")) forbidden();
  const params = readListParams(await props.searchParams);
  return (
    <UsersScreen
      params={params}
      tabs={{ pagePath: "pengaturan", tabs: opened.tabs, open: "pengguna" }}
    />
  );
}
