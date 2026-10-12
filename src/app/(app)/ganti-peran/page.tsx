import { notFound } from "next/navigation";
import { AccountPicker } from "@/auth/account-picker";
import { accountSwitcherOn } from "@/auth/account-switcher";
import { accountsInRoleOrder } from "@/auth/accounts";
import { currentAccount } from "@/auth/current-account";
import { database } from "@/db/database";
import { currentStage } from "@/settings";
import { PageHead } from "@/ui/page-head";

export default async function SwitchAccountPage() {
  const current = await currentAccount();
  if (!accountSwitcherOn(currentStage())) notFound();
  const accounts = await accountsInRoleOrder(database());
  return (
    <>
      <PageHead title="Masuk sebagai">
        Login belum aktif. Pilih akun untuk mensimulasikan hak akses tiap
        pengguna.
      </PageHead>
      <AccountPicker accounts={accounts} currentId={current?.id ?? null} />
    </>
  );
}
