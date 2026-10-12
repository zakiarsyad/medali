import { forbidden, notFound, redirect } from "next/navigation";
import { currentDorm } from "@/features/dorm/current-dorm";
import { mayOpenPage, mayOpenTab, needsDormResident, tabsFor } from "./access";
import type { Account } from "./accounts";
import { askToSignIn } from "./ask-to-sign-in";
import { currentAccount } from "./current-account";
import { type Page, pageAt, type TabDefinition } from "./pages";

export interface OpenedPage {
  account: Account;
  page: Page;
  tab: TabDefinition | null;
  tabs: TabDefinition[];
}

/**
 * Checks that the current account may open a page, and one of its tabs.
 * Refuses it otherwise, sends someone who is not signed in to the
 * sign-in page, and refuses a student who does not live in the dorm a
 * page that is for residents. A tabbed page opened without a tab goes to the
 * account's first tab there.
 */
export async function openPage(
  pagePath: string,
  tabPath?: string,
): Promise<OpenedPage> {
  // Before the page is looked up: someone who is not signed in learns
  // nothing of the app, not even which addresses exist.
  const account = await currentAccount();
  if (!account) askToSignIn();
  const page = pageAt(pagePath);
  if (!page) notFound();
  if (!mayOpenPage(account.roles, page.id)) forbidden();
  if (needsDormResident(account.roles, page.id)) {
    if ((await currentDorm(account.studentId)) === null) forbidden();
  }

  const tabs = tabsFor(account.roles, page.id);
  if (tabPath === undefined) {
    const first = tabs[0];
    if (first) redirect(`/${page.path}/${first.path}`);
    return { account, page, tab: null, tabs };
  }
  const pageTabs: readonly TabDefinition[] = "tabs" in page ? page.tabs : [];
  const tab = pageTabs.find((candidate) => candidate.path === tabPath);
  if (!tab) notFound();
  if (!mayOpenTab(account.roles, page.id, tab.id)) forbidden();
  return { account, page, tab, tabs };
}
