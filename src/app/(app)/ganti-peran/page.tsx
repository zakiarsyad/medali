import { notFound, redirect } from "next/navigation";
import { AccountPicker } from "@/auth/account-picker";
import { accountSwitcherOn } from "@/auth/account-switcher";
import { accountsInRoleOrder } from "@/auth/accounts";
import { currentAccount } from "@/auth/current-account";
import { SIGN_IN_PATH } from "@/auth/sign-in-messages";
import { database } from "@/db/database";
import { currentStage } from "@/settings";
import { PageHead } from "@/ui/page-head";

export default async function SwitchAccountPage() {
  const current = await currentAccount();
  const switcherOn = accountSwitcherOn(currentStage());
  if (!switcherOn && !current) redirect(SIGN_IN_PATH);
  if (!switcherOn) notFound();
  const accounts = await accountsInRoleOrder(database());
  return (
    <>
      <PageHead title="Masuk sebagai">
        Pilih akun untuk mensimulasikan hak akses tiap pengguna.
      </PageHead>
      <AccountPicker accounts={accounts} currentId={current?.id ?? null} />
    </>
  );
}
