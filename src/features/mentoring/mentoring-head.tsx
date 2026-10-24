import type { ReactNode } from "react";
import type { TabLinksProps } from "@/ui/tab-links";
import { TabbedHead } from "@/ui/tabbed-head";
import { ReadOnlyLine } from "./read-only-line";

/** The head of every tab of Pengasuhan, with the tab's description under the tabs. */
export function MentoringHead({
  tabs,
  lede,
  readsOnly,
}: {
  tabs: TabLinksProps;
  lede: ReactNode;
  /** Whether the account only reads the tab, and is told who fills it in. */
  readsOnly: boolean;
}) {
  return (
    <TabbedHead title="Pengasuhan" tabs={tabs} lede={lede}>
      {readsOnly && <ReadOnlyLine />}
    </TabbedHead>
  );
}
