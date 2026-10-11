import { forbidden, notFound, redirect } from "next/navigation";
import { mayOpenPage, mayOpenTab, tabsFor } from "./access";
import type { Account } from "./accounts";
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
 * Refuses it otherwise. A tabbed page opened without a tab goes to the
 * account's first tab there.
 */
export async function openPage(
  pagePath: string,
  tabPath?: string,
): Promise<OpenedPage> {
  const page = pageAt(pagePath);
  if (!page) notFound();
  const account = await currentAccount();
  if (!account || !mayOpenPage(account.roles, page.id)) forbidden();

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
