import type { ReactNode } from "react";
import { mayOpenPage, pagesForAccount } from "@/auth/access";
import { accountSwitcherOn } from "@/auth/account-switcher";
import { currentSignIn } from "@/auth/current-account";
import { signedInAs } from "@/auth/signed-in-as";
import { database } from "@/db/database";
import { currentDorm } from "@/features/dorm/current-dorm";
import { countDormTasks } from "@/features/dorm/tasks-list";
import { readOpenCoachingCount } from "@/features/guidance/coaching-board";
import { currentStage } from "@/settings";
import { AppShell } from "@/ui/app-shell";
import { BareScreen } from "@/ui/bare-screen";
import { withMenuCounts } from "@/ui/menu-counts";

/**
 * The pages inside the menu, with how many items wait on Tugas saya for
 * the account, and beside Pembinaan how many students of the account's
 * rows on Pembinaan karakter are not yet Selesai. The sign-in page stays
 * outside it. Someone who is not signed in gets no menu either: only
 * what the page answers, which is a way to the sign-in page.
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const signedIn = await currentSignIn();
  if (!signedIn) return <BareScreen>{children}</BareScreen>;
  const { account } = signedIn;
  const switcherOn = accountSwitcherOn(currentStage());
  const [dorm, waiting, coaching] = await Promise.all([
    currentDorm(account.studentId),
    mayOpenPage(account.roles, "tasks")
      ? countDormTasks(database(), account, new Date())
      : 0,
    readOpenCoachingCount(database(), account),
  ]);
  const menu = withMenuCounts(pagesForAccount(account.roles, dorm !== null), {
    tasks: waiting,
    guidance: coaching,
  });
  return (
    <AppShell menu={menu} signedInAs={signedInAs(signedIn, switcherOn)}>
      {children}
    </AppShell>
  );
}
