import type { ReactNode } from "react";
import { pagesFor } from "@/auth/access";
import { accountSwitcherOn } from "@/auth/account-switcher";
import { currentSignIn } from "@/auth/current-account";
import { signedInAs } from "@/auth/signed-in-as";
import { currentStage } from "@/settings";
import { AppShell } from "@/ui/app-shell";
import { BareScreen } from "@/ui/bare-screen";

/**
 * The pages inside the menu. The sign-in page stays outside it. Someone
 * who is not signed in gets no menu either: only what the page answers,
 * which is a way to the sign-in page.
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const signedIn = await currentSignIn();
  if (!signedIn) return <BareScreen>{children}</BareScreen>;
  const switcherOn = accountSwitcherOn(currentStage());
  return (
    <AppShell
      menu={pagesFor(signedIn.account.roles)}
      signedInAs={signedInAs(signedIn, switcherOn)}
    >
      {children}
    </AppShell>
  );
}
