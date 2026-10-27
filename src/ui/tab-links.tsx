import { TabRow } from "./tab-row";

export interface TabLinksProps {
  pagePath: string;
  tabs: { path: string; title: string }[];
  /** The path of the tab that is open. */
  open: string;
}

/** Whether the role has a choice of tabs, so the tab bar is drawn. */
export function showsTabBar(tabs: TabLinksProps["tabs"]): boolean {
  return tabs.length > 1;
}

export function TabLinks({ pagePath, tabs, open }: TabLinksProps) {
  if (!showsTabBar(tabs)) return null;

  return <TabRow pagePath={pagePath} tabs={tabs} open={open} />;
}
