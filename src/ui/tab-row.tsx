"use client";

import Link from "next/link";
import { use } from "react";
import { isWithin, markedPath } from "./page-change";
import { OpeningPage } from "./page-opening";
import type { TabLinksProps } from "./tab-links";
import styles from "./tab-links.module.css";

/** The tabs, with the one pressed marked at once while its page opens. */
export function TabRow({ pagePath, tabs, open }: TabLinksProps) {
  const addressOf = (path: string) => `/${pagePath}/${path}`;
  const addresses = tabs.map((tab) => addressOf(tab.path));
  const marked = markedPath(addresses, use(OpeningPage), addressOf(open));
  return (
    <nav className={styles.tabs} aria-label="Bagian halaman">
      {tabs.map((tab) => (
        <Link
          key={tab.path}
          href={addressOf(tab.path)}
          className={styles.tab}
          aria-current={
            isWithin(marked, addressOf(tab.path)) ? "page" : undefined
          }
        >
          {tab.title}
        </Link>
      ))}
    </nav>
  );
}
