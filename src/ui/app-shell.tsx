import type { ReactNode } from "react";
import styles from "./app-shell.module.css";
import { SideMenu } from "./side-menu";
import { TopBar } from "./top-bar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className={styles.shell}>
      <SideMenu />
      <div className={styles.main}>
        <TopBar />
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
