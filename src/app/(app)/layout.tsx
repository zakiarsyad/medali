import type { ReactNode } from "react";
import { pagesFor } from "@/auth/access";
import { accountSwitcherOn } from "@/auth/account-switcher";
import { currentSignIn } from "@/auth/current-account";
import { signedInAs } from "@/auth/signed-in-as";
import { currentStage } from "@/settings";
import { AppShell } from "@/ui/app-shell";

/** The pages inside the menu. The sign-in page stays outside it. */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const signedIn = await currentSignIn();
  const switcherOn = accountSwitcherOn(currentStage());
  return (
    <AppShell
      menu={signedIn ? pagesFor(signedIn.account.roles) : []}
      signedInAs={signedIn ? signedInAs(signedIn, switcherOn) : null}
    >
      {children}
    </AppShell>
  );
}
