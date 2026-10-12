import type { ReactNode } from "react";
import { pagesFor } from "@/auth/access";
import { currentAccount } from "@/auth/current-account";
import { signedInAs } from "@/auth/signed-in-as";
import { AppShell } from "@/ui/app-shell";

/** The pages inside the menu. The sign-in page stays outside it. */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const account = await currentAccount();
  return (
    <AppShell
      menu={account ? pagesFor(account.roles) : []}
      signedInAs={account ? signedInAs(account) : null}
    >
      {children}
    </AppShell>
  );
}
