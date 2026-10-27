import type { ReactNode } from "react";
import styles from "./app-shell.module.css";
import type { MenuItem, SignedInAs } from "./menu-types";
import { MovingContent, PageMoveProvider } from "./page-move";
import { SideMenu } from "./side-menu";
import { TopBar } from "./top-bar";

interface AppShellProps {
  children: ReactNode;
  menu: MenuItem[];
  signedInAs: SignedInAs | null;
}

export function AppShell({ children, menu, signedInAs }: AppShellProps) {
  return (
    <PageMoveProvider>
      <div className={styles.shell}>
        <SideMenu menu={menu} signedInAs={signedInAs} />
        <div className={styles.main}>
          <TopBar />
          <MovingContent className={styles.content}>{children}</MovingContent>
        </div>
      </div>
    </PageMoveProvider>
  );
}
