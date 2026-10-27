import type { ReactNode } from "react";
import styles from "./app-shell.module.css";
import type { MenuItem, SignedInAs } from "./menu-types";
import { PageContent, PageOpeningWatch } from "./page-opening";
import { SideMenu } from "./side-menu";
import { TopBar } from "./top-bar";

interface AppShellProps {
  children: ReactNode;
  menu: MenuItem[];
  signedInAs: SignedInAs | null;
}

export function AppShell({ children, menu, signedInAs }: AppShellProps) {
  return (
    <PageOpeningWatch>
      <div className={styles.shell}>
        <SideMenu menu={menu} signedInAs={signedInAs} />
        <div className={styles.main}>
          <TopBar />
          <PageContent className={styles.content}>{children}</PageContent>
        </div>
      </div>
    </PageOpeningWatch>
  );
}
