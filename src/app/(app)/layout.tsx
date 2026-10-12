import type { ReactNode } from "react";
import { pagesForAccount } from "@/auth/access";
import { accountSwitcherOn } from "@/auth/account-switcher";
import { currentSignIn } from "@/auth/current-account";
import { signedInAs } from "@/auth/signed-in-as";
import { currentDorm } from "@/features/dorm/current-dorm";
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
  const dorm = await currentDorm(signedIn.account.studentId);
  return (
    <AppShell
      menu={pagesForAccount(signedIn.account.roles, dorm !== null)}
      signedInAs={signedInAs(signedIn, switcherOn)}
    >
      {children}
    </AppShell>
  );
}
